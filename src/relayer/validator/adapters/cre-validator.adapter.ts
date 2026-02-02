import { encodeAbiParameters, encodePacked, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';

import { CRE, JobPayload, JobStatus } from '../../../types';
import { ArrayLib } from '../../../utils';
import { CREExecutorService } from '../../services';
import { Context, ValidatorType } from '../../types';

// @todo: move to global constants
export const requiredCallbacksCount = 4;
export const creBatchSize = 40;
export const pumpBatchCountPerTick = 2;

// @todo: move to time utils
const msInMin = 60_000;
const creRequestExpirationMs = 5 * msInMin;
export const messageSubmissionExpirationMs = 3 * msInMin;

export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    private readonly creExecutorService: CREExecutorService;

    constructor(context: Context) {
        super('CREValidatorAdapter', context);
        this.creExecutorService = new CREExecutorService();
    }

    async pumpPendingVerification(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingVerification,
                validatorType: ValidatorType.CRE,
                OR: [
                    {
                        lastVerificationRequestedAt: {
                            lt: new Date(Date.now() - creRequestExpirationMs),
                        },
                    },
                    {
                        lastVerificationRequestedAt: null,
                    },
                ],
            },
            { take: size },
        );

        if (jobs.length === 0) {
            return;
        }

        const batches = ArrayLib.toChunks(jobs, pumpBatchCountPerTick);

        for (const batch of batches) {
            const batchJobIds = batch.map(i => i.id);
            try {
                // set last verification requested date
                await this.context.jobQueue.updateMany(
                    { id: { in: batchJobIds } },
                    {
                        lastVerificationRequestedAt: new Date(),
                    },
                );
                // execute workflow for CRE batch
                const creBatch: CRE.Request['batch'] = batch.map(i => ({
                    blockNumber: String(i.srcBlockNumber),
                    messageId: i.messageId as Hex,
                    srcChainSelector: i.srcChainSelector,
                }));
                await this.creExecutorService.execute(creBatch);
                // move to submit waiting if batch was executed
                await this.context.jobQueue.updateMany(
                    { id: { in: batchJobIds } },
                    {
                        status: JobStatus.PendingSubmit,
                    },
                );
            } catch (e) {
                this.logger.error(`Failed CRE request ${e}`);
                // move to verification request failed if batch was not executed
                await this.context.jobQueue.updateMany(
                    { id: { in: batchJobIds } },
                    { status: JobStatus.FailedVerification },
                );
            }
        }

        this.logger.info(`pumpPendingRequest took: ${(Date.now() - start) / 1000}s`);
    }

    // CRE request failed => retry
    // CRE callbacks count in creRequestExpirationMs less than requiredCallbacksCount => retry
    async pumpFailedVerification(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                validatorType: ValidatorType.CRE,
                OR: [
                    { status: JobStatus.FailedVerification },
                    {
                        callbacksCount: { lt: requiredCallbacksCount },
                        lastVerificationRequestedAt: new Date(Date.now() - creRequestExpirationMs),
                    },
                ],
            },
            { take: size },
        );
        const messageIds = ArrayLib.deduplicate(jobs.map(i => i.messageId));

        if (jobs.length === 0) {
            return;
        }

        await this.context.dbClient.$transaction(async client => {
            client.creCallback.deleteMany({
                where: {
                    messageId: {
                        in: messageIds,
                    },
                },
            });
            client.job.updateMany({
                where: {
                    messageId: { in: messageIds },
                },
                data: {
                    status: JobStatus.PendingVerification,
                    callbacksCount: 0,
                },
            });
        });
        await this.context.dbClient.creCallback.deleteMany({
            where: {
                messageId: {
                    in: ArrayLib.deduplicate(jobs.map(i => i.messageId)),
                },
            },
        });

        await this.context.jobQueue.updateMany(
            {
                messageId: { in: messageIds },
            },
            {
                status: JobStatus.PendingVerification,
                callbacksCount: 0,
            },
        );

        this.logger.info(`pumpFailedRequest took: ${(Date.now() - start) / 1000}s`);
    }

    async pumpPendingSubmit(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingSubmit,
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
            { lastSubmittedAt: new Date() },
        );

        const batches = ArrayLib.toChunks(jobs, 10);

        for (const batch of batches) {
            const promises = await Promise.allSettled(
                batch.map(async item => {
                    const itemPayload = JSON.parse(item.payload) as JobPayload;

                    const callbacks = await this.context.dbClient.creCallback.findMany({
                        where: { messageId: item.messageId },
                    });

                    const validation = this.packCREValidationFromResponse(
                        callbacks.map(c => JSON.parse(c.payload)),
                        item.messageId as Hex,
                    );

                    this.logger.info(
                        `Submit message [${item.messageId}] to chain ${item.dstChainSelector}`,
                    );

                    const dst = await this.submitMessage(
                        itemPayload,
                        [validation],
                        [
                            this.context.deploymentManager.getConceroValidatorLibByChainSelector(
                                itemPayload.parsedReceipt.dstChainSelector,
                            ),
                        ],
                    );
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
                { status: JobStatus.WaitingDstFinality },
            );
        }

        this.logger.info(`pumpPendingConfirm took: ${(Date.now() - start) / 1000}s`);
    }

    // tx submission does not succeed in messageSubmissionExpirationMs timeout => re-request
    // if callbacksCount is not valid => re-request
    async pumpStuckVerificationRequests(size: number): Promise<void> {
        const start = Date.now();

        const stuckRequests = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingSubmit,
                validatorType: ValidatorType.CRE,
                OR: [
                    {
                        lastVerificationRequestedAt: {
                            lte: new Date(Date.now() - messageSubmissionExpirationMs),
                        },
                    },
                    {
                        callbacksCount: { lt: requiredCallbacksCount },
                    },
                ],
            },
            { take: size },
        );

        if (stuckRequests.length === 0) {
            return;
        }

        this.logger.info(`${stuckRequests.length} stuck requests.`);

        const messageIds = ArrayLib.deduplicate(stuckRequests.map(i => i.messageId));

        await this.context.dbClient.creCallback.deleteMany({
            where: { messageId: { in: messageIds } },
        });

        await this.context.jobQueue.updateMany(
            { messageId: { in: messageIds } },
            {
                status: JobStatus.PendingVerification,
                callbacksCount: 0,
            },
        );

        this.logger.info(`pumpStuckVerificationRequests took: ${(Date.now() - start) / 1000}s`);
    }

    private packCREValidationFromResponse(
        creResponses: CRE.Response[],
        messageId: CRE.MessageId,
    ): Hex {
        const rawReport = creResponses[0].report.rawReport as Hex;
        const reportContext = creResponses[0].report.reportContext as Hex;
        const proofs = creResponses[0].proofs[messageId];

        const allSignatures = Array.from(
            new Set(
                creResponses.flatMap(item =>
                    item.report.signs.map(sign => {
                        const hex = sign.signature.startsWith('0x')
                            ? sign.signature
                            : `0x${sign.signature}`;
                        return hex as Hex;
                    }),
                ),
            ),
        );
        const signatures = allSignatures.slice(0, Math.min(allSignatures.length, 4));

        if (!proofs) {
            throw new Error(`Missing merkle proof for messageId=${messageId}`);
        }

        const encodedSignaturesAndProof = encodeAbiParameters(
            [{ type: 'bytes[]' }, { type: 'bytes32[]' }],
            [signatures, proofs],
        );

        return encodePacked(
            ['bytes', 'bytes', 'bytes'],
            [rawReport, reportContext, encodedSignaturesAndProof],
        );
    }
}
