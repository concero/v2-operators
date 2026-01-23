import { concat, Hash, Hex, hexToBytes, keccak256, recoverAddress } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { FastifyReply, FastifyRequest } from 'fastify';

import { allowedSignerAddresses } from '../../constants';
import { CRE, JobPayload, JobStatus } from '../../types';
import { ArrayLib, ObjectLib } from '../../utils';
import { LogModule } from '../log';
import { ContextProvider } from '../services';
import { Context } from '../types';
import { requiredCallbacksCount } from '../validator/adapters';

const secretTokenHeader = 'x-concero-management-token';
export class ApiService extends ContextProvider {
    constructor(context: Context) {
        super('ApiService', context);
    }

    // cre endpoints

    async handleCRECallback(req: FastifyRequest, res: FastifyReply) {
        try {
            const start = Date.now();

            const creResponse = req.body as CRE.Response;
            this.logger.info(`handleCRECallback Got: ${ObjectLib.stringify(creResponse)}`);

            const rawReport = creResponse.report.rawReport;
            const reportContext = creResponse.report.reportContext;
            const signatures = ArrayLib.deduplicate(
                creResponse.report.signs.map(i => `0x${i.signature}`),
            );
            const rawReportBytes = hexToBytes(rawReport);
            const reportContextBytes = hexToBytes(reportContext);
            const hash = keccak256(concat([keccak256(rawReportBytes), reportContextBytes]));
            // validation & auth
            await this.validateWorkflowId(rawReport);
            await this.validateSignatures(signatures, hash);
            // @todo: test validation
            await Promise.all(
                Object.entries(creResponse.proofs).map(async ([messageId, proofs]) => {
                    try {
                        const foundJob = await this.context.jobQueue.findOne({ messageId });
                        if (!foundJob) {
                            throw new Error(`Could not find job with id ${messageId}`);
                        }

                        const jobPayload = JSON.parse(foundJob?.payload ?? '{}') as JobPayload;

                        const merkleRootOffsetStart = 2 + 109 * 2; // RAW_REPORT_METADATA_LENGTH
                        const merkleRootOffsetEnd = 2 + 141 * 2; // RAW_REPORT_LENGTH
                        const merkleRoot =
                            `0x${rawReport.slice(merkleRootOffsetStart, merkleRootOffsetEnd)}` as Hex;

                        const valid = this.verifyMerkleProof(
                            proofs,
                            merkleRoot,
                            jobPayload.data.messageReceipt,
                        );
                        if (!valid) {
                            throw new Error(`Invalid Merkle proof for messageId=${messageId}`);
                        }
                    } catch (e) {
                        this.logger.error(
                            `handleCRECallback Failed proof (messageId=${messageId}): ${e}`,
                        );
                    }
                }),
            );

            const messageIds = ArrayLib.deduplicate(
                Object.keys(creResponse.proofs),
            ) as CRE.MessageId[];

            // bulk create cre callbacks
            await this.context.dbClient.$transaction(async client => {
                await client.creCallback.createMany({
                    data: messageIds.map(messageId => ({
                        messageId,
                        payload: JSON.stringify(creResponse),
                    })),
                });
                await client.job.updateMany({
                    where: {
                        messageId: { in: messageIds },
                        callbacksCount: { lt: requiredCallbacksCount },
                    },
                    data: {
                        callbacksCount: { increment: 1 },
                    },
                });
            });

            this.logger.info(`handleCRECallback took: ${(Date.now() - start) / 1000}s`);
        } catch (e) {
            this.logger.error(`handleCRECallback Failed: ${e}`);
        } finally {
            this.respond(res, { ok: true });
        }
    }

    // management endpoints
    async checkManagementAccess(req: FastifyRequest, res: FastifyReply) {
        if (
            !req.headers[secretTokenHeader] ||
            req.headers[secretTokenHeader] !== process.env.API_SECRET_MANAGEMENT_TOKEN
        ) {
            this.respond(res, { ok: false }, 401);
        }
    }

    async handleGetJobsList(_: FastifyRequest, res: FastifyReply) {
        const data = await this.context.jobQueue.getList();

        this.respond(res, {
            ok: true,
            total: data.length,
            jobs: data.map(i => ({
                ...i,
                payload: {
                    ...JSON.parse(i.payload),
                    data: { ...JSON.parse(i.payload)?.data, messageReceipt: undefined },
                    payload: undefined,
                    parsedReceipt: undefined,
                    callbacks: undefined,
                },
            })),
        });
    }

    async handleRetryJob(
        req: FastifyRequest,
        res: FastifyReply,
        refetchLog: LogModule['refetchLog'],
    ) {
        // @ts-ignore @todo: fix types
        const messageId = String(req.body?.messageId);
        // @ts-ignore @todo: fix types
        const srcChainSelector = Number(req.body?.srcChainSelector);
        // @ts-ignore @todo: fix types
        const blockNumber = BigInt(req.body?.blockNumber);
        const expectedJob = await this.context.jobQueue.findOne({ messageId });
        if (expectedJob) {
            const buildDowngradedStatus = (jobStatus: JobStatus): JobStatus => {
                switch (jobStatus) {
                    case JobStatus.ProcessingRequest:
                        return JobStatus.WaitingSrcConfirmation;
                    case JobStatus.RequestFailed:
                        return JobStatus.ProcessingRequest;
                    case JobStatus.ProcessingConfirm:
                        return JobStatus.ProcessingRequest;
                    case JobStatus.WaitingTxFinality:
                        return JobStatus.ProcessingConfirm;
                    // Reorged, WaitingSrcConfirmation, Successs - the same
                    default:
                        return jobStatus;
                }
            };
            const downgradedStatus = buildDowngradedStatus(expectedJob.status as JobStatus);
            await this.context.jobQueue.updateOne({ messageId }, { status: downgradedStatus });
            this.respond(res, { ok: true, downgradedStatus });
        } else {
            const error = await refetchLog(srcChainSelector, blockNumber, messageId);
            if (error) {
                this.respond(res, { ok: false, error }, 500);
            } else {
                this.respond(res, { ok: true });
            }
        }

        this.respond(res, {
            ok: true,
        });
    }

    async handleGetChainsList(_: FastifyRequest, res: FastifyReply) {
        const data = await this.context.dbClient.logsListenerBlockCheckpoints.findMany();

        this.respond(res, {
            ok: true,
            total: data.length,
            data: data.map(i => ({ ...i, blockNumber: String(i.blockNumber) })),
        });
    }

    // helpers

    private async validateWorkflowId(rawReport: Hex): Promise<void> {
        const bytes = hexToBytes(rawReport);

        // TODO: move to constants
        const workflowIdOffset = 44;
        const workflowIdLength = 32; // bytes32 length

        const workflowId = Buffer.from(
            bytes.slice(workflowIdOffset, workflowIdOffset + workflowIdLength),
        ).toString('hex');
        if (workflowId.toLowerCase() !== process.env.CRE_WORKFLOW_ID?.toLowerCase()) {
            throw new Error(
                `CRE Workflow Id is invalid. Received: ${workflowId}, expected: ${process.env.CRE_WORKFLOW_ID}`,
            );
        }
    }
    private async validateSignatures(signatures: string[], hash: Hash): Promise<void> {
        if (signatures.length !== 4) {
            throw new Error(`Invalid number of signatures: got ${signatures.length}, required 4`);
        }

        let recovered: Hex[] = [];

        for (const signature of signatures) {
            const rawSigner = await recoverAddress({
                hash,
                signature: signature as Hex,
            });
            const normalizedSigner = rawSigner.toLowerCase() as Hex;

            if (!allowedSignerAddresses.includes(normalizedSigner)) {
                throw new Error(
                    `Signer ${normalizedSigner} is not allowed in ${signatures.join(',')}`,
                );
            }

            if (recovered.includes(normalizedSigner)) {
                throw new Error(`Duplicate signer ${normalizedSigner}`);
            }

            recovered.push(normalizedSigner);
        }
    }
    private verifyMerkleProof(proof: Hex[], root: Hex, leaf: Hex): boolean {
        try {
            return StandardMerkleTree.verify(root, ['bytes'], [leaf], proof);
        } catch {
            return false;
        }
    }

    private respond(res: FastifyReply, json: Record<string, unknown>, status = 200) {
        res.headers({ 'content-type': 'application/json' }).status(status).send(json);
    }
}
