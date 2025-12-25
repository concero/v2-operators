import process from 'node:process';
import { encodeAbiParameters, encodePacked, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';
import axios, { AxiosError } from 'axios';

import { CRE, JobPayload, JobStatus } from '../../../types';
import { ArrayLib, createCREJWT, CRERequestBody } from '../../../utils';
import { Context, ValidatorType } from '../../types';

const requiredCallbacksCount = 4;
const msInMin = 60_000;
const creRequestExpirationMs = 5 * msInMin;

export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('CREValidatorAdapter', context);
    }

    async pumpPendingRequest() {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.CRE },
            { take: 100 },
        );

        if (jobs.length === 0) {
            return;
        }

        const batches = ArrayLib.toChunks(jobs, 5);

        for (const batch of batches) {
            try {
                const requestBody: CRERequestBody<CRE.Request> = {
                    jsonrpc: '2.0',
                    id: crypto.randomUUID(),
                    method: 'workflows.execute',
                    params: {
                        input: {
                            batch: batch.map(i => {
                                return {
                                    messageId: i.messageId as Hex,
                                    blockNumber: i.srcBlockNumber,
                                    srcChainSelector: i.srcChainSelector,
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
                await this.context.jobQueue.updateMany(
                    { id: { in: batch.map(i => i.id) } },
                    {
                        status: JobStatus.ProcessingConfirm,
                        lastVerificationRequestedAt: new Date(Date.now()),
                    },
                );
            } catch (e) {
                if (e instanceof AxiosError) {
                    this.logger.error(`Found error: ${JSON.stringify(e.toJSON())}`);
                } else {
                    this.logger.error(`Error ${e}`);
                }
                this.logger.debug(`Failed CRE request ${e}`);
                await this.context.jobQueue.updateMany(
                    { id: { in: batch.map(i => i.id) } },
                    { status: JobStatus.RequestFailed },
                );
            }
        }
    }

    async pumpFailedRequest() {
        const jobs = await this.context.jobQueue.getList(
            {
                OR: [
                    // failed
                    { status: JobStatus.RequestFailed, validatorType: ValidatorType.CRE },
                    // timeout
                    {
                        status: JobStatus.ProcessingRequest,
                        updatedAt: { lte: new Date(Date.now() - 5 * 60_000) },
                        validatorType: ValidatorType.CRE,
                        callbacksCount: { lt: requiredCallbacksCount },
                        // no submit retry
                    },
                ],
            },
            { take: 100 },
        );

        await this.context.dbClient.creCallback.deleteMany({
            where: {
                messageId: {
                    in: Array.from(new Set(jobs.map(i => i.messageId))),
                },
            },
        });

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { status: JobStatus.ProcessingRequest, callbacksCount: 0 },
        );
    }

    async pumpPendingConfirm() {
        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.ProcessingConfirm,
                validatorType: ValidatorType.CRE,
                callbacksCount: { gte: requiredCallbacksCount },
            },
            { take: 100 },
        );

        const batches = ArrayLib.toChunks(jobs, 10);
        for (const batch of batches) {
            const promises = await Promise.allSettled(
                batch.map(async i => {
                    const parsedPayload = JSON.parse(i.payload) as JobPayload;

                    const rawCallbacks = await this.context.dbClient.creCallback.findMany({
                        where: { messageId: i.messageId },
                    });
                    const callbacks = rawCallbacks.map(i =>
                        JSON.parse(i.payload),
                    ) as CRE.Response.Item[];
                    const validations = await this.packCREValidations(callbacks);

                    const dst = await this.submitMessage(parsedPayload, [validations]);
                    await this.context.jobQueue.updateOne(
                        { id: i.id },
                        { dstBlockNumber: String(dst.blockNumber), dstTxHash: dst.hash },
                    );
                    return i.id;
                }),
            );
            const batchJobIds = promises.filter(i => i.status === 'fulfilled').map(i => i.value);
            const batchErrors = promises.filter(i => i.status === 'rejected').map(i => i.reason);
            if (batchErrors.length > 0) {
                this.logger.error(batchErrors.join(';'));
            }

            await this.context.jobQueue.updateMany(
                { id: { in: batchJobIds } },
                { status: JobStatus.WaitingTxFinality },
            );
        }
    }

    async pumpStuckVerificationRequests() {
        const stuckRequests = await this.context.jobQueue.getList({
            status: JobStatus.ProcessingConfirm,
            validatorType: ValidatorType.CRE,
            lastVerificationRequestedAt: { lte: new Date(Date.now() - creRequestExpirationMs) },
            callbacksCount: { lte: requiredCallbacksCount },
        });

        if (stuckRequests.length === 0) {
            this.logger.info('No stuck requests');
            return;
        }

        this.logger.info(`${stuckRequests.length} stuck requests`);

        await this.context.dbClient.creCallback.deleteMany({
            where: {
                messageId: {
                    in: Array.from(new Set(stuckRequests.map(i => i.messageId))),
                },
            },
        });

        await this.context.jobQueue.updateMany(
            { id: { in: stuckRequests.map(i => i.id) } },
            {
                status: JobStatus.ProcessingRequest,
                lastVerificationRequestedAt: null,
                callbacksCount: 0,
            },
        );
    }

    private async packCREValidations(creCallbacks: CRE.Response.Item[]) {
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
        ).slice(0, 7);

        // this.logger.info(`Got signatures: ${signatures.join(', ')}`);
        const encodedSignatures = encodeAbiParameters([{ type: 'bytes[]' }], [signatures as Hex[]]);
        // this.logger.info(`Encoded signatures: ${encodedSignatures}`);

        return encodePacked(
            ['bytes', 'bytes', 'bytes'],
            [rawReport, reportContext, encodedSignatures],
        );
    }
}
