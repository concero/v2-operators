import { concatHex, Hash, Hex, hexToBytes, keccak256, recoverAddress } from 'viem';
import { FastifyReply, FastifyRequest } from 'fastify';

import { allowedSignerAddresses } from '../../constants';
import { CRE, JobStatus } from '../../types';
import { ObjectLib } from '../../utils';
import { LogModule } from '../log';
import { ContextProvider } from '../services';
import { Context } from '../types';

const secretTokenHeader = 'x-concero-management-token';
export class ApiService extends ContextProvider {
    constructor(context: Context) {
        super('ApiService', context);
    }

    // cre endpoints

    async handleCRECallback(req: FastifyRequest, res: FastifyReply) {
        try {
            const body = req.body as CRE.Response;
            const validBody = await this.extractValidResponse(body);
            this.logger.info(`handleCRECallback Got: ${ObjectLib.stringify(body)}`);

            const items = Object.entries(validBody || {});
            if (items.length === 0) {
                return;
            }

            const start = Date.now();

            await this.context.dbClient.creCallback.createMany({
                data: items.map(([messageId, payload]) => ({
                    messageId,
                    payload: JSON.stringify(payload),
                })),
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

    private async extractValidResponse(creResponse: CRE.Response): Promise<CRE.Response> {
        let result: CRE.Response = {};

        const validateWorkflowId = (rawReport: Hex): void => {
            const bytes = hexToBytes(rawReport);

            // TODO: move to constants
            const workflowIdOffset = 77;
            const workflowIdLength = 32; // bytes32 length

            const workflowId = Buffer.from(
                bytes.slice(workflowIdOffset, workflowIdOffset + workflowIdLength),
            ).toString('hex');
            if (workflowId.toLowerCase() !== process.env.CRE_WORKFLOW_ID?.toLowerCase()) {
                throw new Error(
                    `CRE Workflow Id is invalid. Received: ${workflowId}, expected: ${process.env.CRE_WORKFLOW_ID}`,
                );
            }
        };

        const validateSignatures = async (signatures: string[], hash: Hash) => {
            if (signatures.length < 7) {
                throw new Error(
                    `Invalid number of signatures: got ${signatures.length}, required 7`,
                );
            }

            const recovered: Hex[] = [];

            for (const signature of signatures) {
                const rawSigner = await recoverAddress({
                    hash,
                    signature: signature as Hex,
                });
                const normalizedSigner = rawSigner.toLowerCase() as Hex;

                if (!allowedSignerAddresses.includes(normalizedSigner)) {
                    throw new Error(`Signer ${normalizedSigner} is not allowed`);
                }

                if (recovered.includes(normalizedSigner)) {
                    throw new Error(`Duplicate signer ${normalizedSigner}`);
                }

                recovered.push(normalizedSigner);
            }
        };

        Object.entries(creResponse).map(async ([messageId, item]) => {
            try {
                const { rawReport, reportContext, signs } = item;
                validateWorkflowId(rawReport as Hex);

                const signatures = signs.map(i => i.signature);
                const hash = keccak256(concatHex([rawReport as Hex, reportContext as Hex]));
                await validateSignatures(signatures, hash);

                result[messageId] = item;
            } catch (e) {
                this.logger.error(`extractValidItems failed: ${e}`);
            }
        });

        return result;
    }

    private respond(res: FastifyReply, json: Record<string, unknown>, status = 200) {
        res.headers({ 'content-type': 'application/json' }).status(status).send(json);
    }
}
