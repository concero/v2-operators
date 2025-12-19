import * as process from 'node:process';
import { encodeAbiParameters, encodePacked, Hash, Hex } from 'viem';
import { LoggerInterface } from '@concero/operator-utils';
import { BaseVerifierStrategy } from './base-verifier.strategy';
import { VerifierStrategy } from './verifier.interface';
import axios, { AxiosError } from 'axios';

import { createCREJWT, CRERequestBody } from '../../../utils';
import { Context, JobPayload, JobStatus } from '../../types';

const packCREValidations = (
    logger: LoggerInterface,
    creCallbacks: CREVerifierStrategy.CRE.Response.Item[],
): Hex => {
    const rawReport = creCallbacks[0].rawReport as Hex;
    const reportContext = creCallbacks[0].reportContext as Hex;

    const signatures = Array.from(
        new Set(
            creCallbacks.flatMap(item =>
                item.signs.map(sign => {
                    const hex = sign.signature.startsWith('0x')
                        ? sign.signature
                        : `0x${sign.signature}`;
                    return hex as Hex;
                }),
            ),
        ),
    );

    logger.info(`Got signatures: ${signatures.join(', ')}`);
    const encodedSignatures = encodeAbiParameters([{ type: 'bytes[]' }], [signatures as Hex[]]);
    logger.info(`Encoded signatures: ${encodedSignatures}`);

    return encodePacked(['bytes', 'bytes', 'bytes'], [rawReport, reportContext, encodedSignatures]);
};

export class CREVerifierStrategy extends BaseVerifierStrategy implements VerifierStrategy {
    private isFlushing = false;

    constructor(ctx: Context) {
        super('CREVerifierStrategy', ctx);
    }

    async requestVerification(payload: JobPayload) {}

    async addConfirmationCallback(response: CREVerifierStrategy.CRE.Response) {
        const handleResponseItem = async ([messageId, item]: [
            messageId: string,
            item: CREVerifierStrategy.CRE.Response.Item,
        ]): Promise<void> => {
            const found = await this.context.jobQueue.findOne({ messageId });
            if (!found) {
                this.logger.warn(`Job for messageId=${messageId} not found`);
                return;
            }

            const foundPayload = JSON.parse(found.payload) as JobPayload;

            const mergedCallbacks: CREVerifierStrategy.CRE.Response.Item[] = foundPayload?.callbacks
                ? Array.from(
                      (foundPayload['callbacks'] || []) as CREVerifierStrategy.CRE.Response.Item[],
                  ).concat(item)
                : [item];
            const mergedPayload = {
                ...foundPayload,
                callbacks: mergedCallbacks,
            };

            await this.context.jobQueue.updateOne(
                { messageId },
                { payload: JSON.stringify(mergedPayload) },
            );

            this.logger.debug(
                `Callbacks for messageId=${messageId} count is ${mergedCallbacks?.length || 0}`,
            );
        };

        await Promise.all(
            Object.entries(response || {}).map(async options => handleResponseItem(options)),
        );
    }

    confirmVerification(): Promise<void> {
        return Promise.resolve(undefined);
    }

    private async processRequests() {
        if (this.isFlushing) {
            return;
        }

        // cre supports only 2 batches without "go panic error"
        const batch = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest },
            { take: 2, skip: 0 },
        );
        if (batch.length === 0) {
            return;
        }

        this.logger.debug(
            `Processing ${batch.length} requests (ids=${batch.map(i => i.id).join(',')}) `,
        );

        try {
            this.isFlushing = true;

            const requestBody: CRERequestBody<CREVerifierStrategy.CRE.Request> = {
                jsonrpc: '2.0',
                id: Date.now().toString(),
                method: 'workflows.execute',
                params: {
                    input: {
                        batch: batch.map(i => {
                            const payload = JSON.parse(i.payload) as JobPayload;
                            return {
                                messageId: i.messageId as Hex,
                                blockNumber: String(payload.blockNumber),
                                srcChainSelector: payload.parsedReceipt.srcChainSelector,
                            };
                        }),
                    },
                    workflow: { workflowID: process.env.CRE_WORKFLOW_ID as string },
                },
            };
            const token = await createCREJWT(
                requestBody,
                process.env.CRE_REQUESTER_PRIVATE_KEY as Hex,
            );

            this.logger.info('Token: ' + token + ', RequestBody: ' + JSON.stringify(token));

            try {
                await axios.post(
                    // @todo: fix types
                    process.env.CRE_BASE_URL as string,
                    requestBody,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );
            } catch (e) {
                if (e instanceof AxiosError) {
                    // @ts-ignore
                    this.logger.error(`Found error: ${JSON.stringify(e.response)}`);
                } else {
                    this.logger.error(`Error ${e}`);
                }
                throw e;
            }

            await this.context.jobQueue.updateMany(
                { id: { in: batch.map(i => i.id) } },
                {
                    status: JobStatus.ProcessingConfirm,
                },
            );
        } catch (e) {
            throw e;
        } finally {
            this.isFlushing = false;
        }
    }

    private async processConfirmations() {
        const batch = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingConfirm },
            { take: 10, skip: 0 },
        );
        if (!batch.length) {
            return;
        }

        this.logger.debug(`Processing confirmations (ids=${batch.map(i => i.id).join(',')})`);

        await Promise.all(
            batch.map(async i => {
                const parsedPayload = JSON.parse(i.payload) as JobPayload;
                if (!Array.isArray(parsedPayload.callbacks)) {
                    this.logger.debug(
                        `Processing confirmations job=${i.id} failed (no callbacks found)`,
                    );
                    return;
                }

                const validations = packCREValidations(this.logger, parsedPayload.callbacks);
                await this.submitMessage(parsedPayload, [validations]);

                await this.context.jobQueue.updateOne({ id: i.id }, { status: JobStatus.Success });
            }),
        );
    }

    async init() {
        setInterval(() => this.processRequests(), 1000);
        setInterval(() => this.processConfirmations(), 1000);
    }
}

export namespace CREVerifierStrategy {
    export namespace CRE {
        export type Request = {
            batch: Request.Item[];
        };
        export namespace Request {
            export type Item = {
                messageId: Hash;
                srcChainSelector: number;
                blockNumber: string;
            };
        }

        export type Response = { [messageId: string]: Response.Item };
        export namespace Response {
            export type Item = {
                rawReport: string;
                reportContext: string;
                signs: {
                    signature: string;
                    signerId: number;
                }[];
            };
        }
    }
}
