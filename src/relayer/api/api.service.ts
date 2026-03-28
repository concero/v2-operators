import { encodePacked, Hash, Hex, hexToBytes, keccak256, recoverAddress } from 'viem';
import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { Job } from '@prisma/client';
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
            ) as Hex[];

            const rawReportHashBytes = keccak256(`0x${rawReport}`);
            const hashBytes = encodePacked(
                ['bytes32', 'bytes'],
                [rawReportHashBytes, reportContext],
            );
            const hash = keccak256(hashBytes);

            // validation & auth
            await this.validateSignatures(signatures, hash);
            this.validateWorkflowId(rawReport);
            this.validateTimestamp(rawReport);
            // @todo: test validation

            const messageIds = Object.keys(creResponse.proofs) as CRE.MessageId[];

            const jobs = await this.context.jobQueue.getList({
                messageId: { in: messageIds },
            });
            const jobHashmap: Record<Job['messageId'], Job> = {};
            for (const job of jobs) {
                jobHashmap[job.messageId] = job;
            }

            await Promise.all(
                Object.entries(creResponse.proofs).map(async ([messageId, proofs]) => {
                    const foundJob = await this.context.jobQueue.findOne({ messageId });
                    if (!foundJob) {
                        throw new Error(`Could not find job with id ${messageId}`);
                    }

                    const jobPayload = JSON.parse(foundJob?.payload ?? '{}') as JobPayload;

                    const merkleRootOffsetStart = 109 * 2; // RAW_REPORT_METADATA_LENGTH
                    const merkleRootOffsetEnd = 141 * 2; // RAW_REPORT_LENGTH
                    const merkleRoot =
                        `0x${rawReport.slice(merkleRootOffsetStart, merkleRootOffsetEnd)}` as Hex;

                    const isValid = this.verifyMerkleProof(
                        proofs,
                        merkleRoot,
                        jobPayload.data.messageId,
                    );
                    if (!isValid) {
                        throw new Error(`Invalid Merkle proof for messageId=${messageId}`);
                    }
                }),
            );

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
                    case JobStatus.PendingVerification:
                        return JobStatus.WaitingSrcConfirmation;
                    case JobStatus.FailedVerification:
                        return JobStatus.PendingVerification;
                    case JobStatus.PendingSubmit:
                        return JobStatus.PendingVerification;
                    case JobStatus.WaitingDstFinality:
                        return JobStatus.PendingSubmit;
                    // Reorged, WaitingSrcConfirmation, Successs, Failed - the same
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

    private validateWorkflowId(rawReport: Hex): void {
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

    private validateTimestamp(rawReport: Hex): void {
        // @todo: move to constants
        const MAX_FUTURE_DRIFT_SEC = 60;
        const MAX_REPORT_AGE_SEC = 5 * 60;

        const reportTimestamp = this.extractCREReportTimestamp(rawReport);
        const nowSec = Math.floor(Date.now() / 1000);

        // @todo: use custom errors, not native Error
        if (reportTimestamp > nowSec + MAX_FUTURE_DRIFT_SEC) {
            throw new Error(
                `CRE report timestamp is from the future: report=${reportTimestamp}, now=${nowSec}`,
            );
        }

        if (nowSec > reportTimestamp + MAX_REPORT_AGE_SEC) {
            throw new Error(
                `CRE report timestamp is too old: report=${reportTimestamp}, now=${nowSec}`,
            );
        }
    }

    // @todo: move to united CRE utils/extractors from API business logic
    // returns UTC seconds timestamp from CRE rawReport
    private extractCREReportTimestamp(rawReport: Hex): number {
        // rawReport is hex WITHOUT 0x
        const TIMESTAMP_OFFSET_BYTES = 65;
        const TIMESTAMP_LENGTH_BYTES = 4;

        const start = TIMESTAMP_OFFSET_BYTES * 2;
        const end = start + TIMESTAMP_LENGTH_BYTES * 2;

        const tsHex = rawReport.slice(start, end);

        return parseInt(tsHex, 16);
    }

    private async validateSignatures(signatures: Hex[], hash: Hash): Promise<void> {
        if (signatures.length !== 4) {
            throw new Error(`Invalid number of signatures: got ${signatures.length}, required 4`);
        }

        let recovered: Hex[] = [];

        for (const signature of signatures) {
            const rawSigner = await recoverAddress({
                hash,
                signature: signature,
            });
            const normalizedSigner = rawSigner.toLowerCase() as Hex;

            if (!allowedSignerAddresses.includes(normalizedSigner)) {
                throw new Error(
                    `Signer ${normalizedSigner} is not allowed in ${allowedSignerAddresses.join(',')}`,
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
            return StandardMerkleTree.verify(root, ['bytes32'], [leaf], proof);
        } catch (e) {
            this.logger.info(`Merkle tree verification failed ${JSON.stringify(e)}`);
            return false;
        }
    }

    private respond(res: FastifyReply, json: Record<string, unknown>, status = 200) {
        res.headers({ 'content-type': 'application/json' }).status(status).send(json);
    }
}
