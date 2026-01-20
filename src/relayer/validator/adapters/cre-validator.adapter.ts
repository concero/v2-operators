import process from 'node:process';
import { concatHex, encodeAbiParameters, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';
import axios from 'axios';

import { CRE, JobPayload, JobStatus } from '../../../types';
import { ArrayLib, createCREJWT, CRERequestBody } from '../../../utils';
import { Context, ValidatorType } from '../../types'; // @todo: move to global constants

// @todo: move to global constants
export const requiredCallbacksCount = 4;
const msInMin = 60_000;
const creRequestExpirationMs = 5 * msInMin;
const messageSubmissionExpirationMs = 3 * msInMin;

export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('CREValidatorAdapter', context);
    }

    async pumpPendingRequest(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.CRE },
            { take: size },
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
                await this.context.dbClient.counter.upsert({
                    where: { type: 'creBufferSize' },
                    update: {
                        value: { increment: batch.length },
                    },
                    create: {
                        type: 'creBufferSize',
                        value: batch.length,
                    },
                });
            } catch (e) {
                this.logger.error(`Failed CRE request ${e}`);
                await this.context.jobQueue.updateMany(
                    { id: { in: batch.map(i => i.id) } },
                    { status: JobStatus.RequestFailed },
                );
            }
        }

        this.logger.info(`pumpPendingRequest took: ${(Date.now() - start) / 1000}s`);
    }

    async pumpFailedRequest(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.RequestFailed,
                validatorType: ValidatorType.CRE,
            },
            { take: size },
        );

        if (jobs.length === 0) {
            return;
        }

        await this.context.dbClient.creCallback.deleteMany({
            where: {
                messageId: {
                    in: ArrayLib.deduplicate(jobs.map(i => i.messageId)),
                },
            },
        });

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { status: JobStatus.ProcessingRequest, callbacksCount: 0 },
        );

        this.logger.info(`pumpFailedRequest took: ${(Date.now() - start) / 1000}s`);
    }

    async pumpPendingConfirm(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.ProcessingConfirm,
                validatorType: ValidatorType.CRE,
                callbacksCount: { gte: requiredCallbacksCount },
                OR: [
                    {
                        lastSubmittedAt: {
                            lte: new Date(Date.now() - messageSubmissionExpirationMs),
                        },
                    },
                    { lastSubmittedAt: null },
                ],
            },
            { take: size },
        );

        if (jobs.length === 0) {
            return;
        }

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { lastSubmittedAt: new Date(Date.now()) },
        );

        const batches = ArrayLib.toChunks(jobs, 10);

        for (const batch of batches) {
            const promises = await Promise.allSettled(
                batch.map(async item => {
                    const itemPayload = JSON.parse(item.payload) as JobPayload;
                    const creCallback = await this.context.dbClient.creCallback.findFirst({
                        where: {
                            messageId: item.messageId,
                        },
                    });

                    const validation = await this.packCREValidationFromResponse(
                        JSON.parse(creCallback?.payload ?? '{}') as CRE.Response,
                        item.messageId as Hex,
                    );

                    this.logger.info(
                        `Submit message [${item.messageId}] to chain ${item.dstChainSelector}`,
                    );

                    const dst = await this.submitMessage(itemPayload, [validation]);
                    await this.context.jobQueue.updateOne(
                        { id: item.id },
                        { dstBlockNumber: String(dst.blockNumber), dstTxHash: dst.hash },
                    );
                    return item.id;
                }),
            );
            const successJobIds = promises.filter(i => i.status === 'fulfilled').map(i => i.value);
            const batchErrors = promises.filter(i => i.status === 'rejected').map(i => i.reason);
            if (batchErrors.length > 0) {
                this.logger.error(batchErrors.join(';'));
            }

            await this.context.jobQueue.updateMany(
                { id: { in: successJobIds } },
                { status: JobStatus.WaitingTxFinality },
            );
        }

        this.logger.info(`pumpPendingConfirm took: ${(Date.now() - start) / 1000}s`);
    }

    // change status to failed and reset callbackCount based on timeout
    async pumpStuckVerificationRequests(size: number): Promise<void> {
        const start = Date.now();

        const stuckRequests = await this.context.jobQueue.getList(
            {
                status: JobStatus.RequestFailed,
                validatorType: ValidatorType.CRE,
                lastVerificationRequestedAt: {
                    lte: new Date(Date.now() - creRequestExpirationMs),
                },
                callbacksCount: { lte: requiredCallbacksCount },
            },
            { take: size },
        );

        if (stuckRequests.length === 0) {
            return;
        }

        this.logger.info(`${stuckRequests.length} stuck requests`);

        const messageIds = ArrayLib.deduplicate(stuckRequests.map(i => i.messageId));

        await this.context.dbClient.creCallback.deleteMany({
            where: { messageId: { in: messageIds } },
        });

        await this.context.jobQueue.updateMany(
            { messageId: { in: messageIds } },
            {
                status: JobStatus.ProcessingRequest,
                callbacksCount: 0,
            },
        );

        this.logger.info(`pumpStuckVerificationRequests took: ${(Date.now() - start) / 1000}s`);
    }

    private async packCREValidationFromResponse(
        creResponse: CRE.Response,
        messageId: CRE.MessageId,
    ): Promise<Hex> {
        const rawReport = creResponse.report.rawReport as Hex;
        const reportContext = creResponse.report.reportContext as Hex;
        const signatures: Hex[] = creResponse.report.signs.map(s => s.signature as Hex);

        const proofs = creResponse.proofs[messageId];
        if (!proofs) {
            throw new Error(`Missing merkle proof for messageId=${messageId}`);
        }

        const encodedSignaturesAndProof = encodeAbiParameters(
            [
                { name: 'signatures', type: 'bytes[]' },
                { name: 'proof', type: 'bytes32[]' },
            ],
            [signatures, proofs],
        );

        return concatHex([rawReport, reportContext, encodedSignaturesAndProof]);
    }
}
