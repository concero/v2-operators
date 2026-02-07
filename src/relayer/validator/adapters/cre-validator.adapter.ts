import { encodeAbiParameters, encodePacked, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';

import { CRE, JobPayload, JobStatus } from '../../../types';
import { ArrayLib } from '../../../utils';
import { CREExecutorService } from '../../services';
import { Context, ValidatorType } from '../../types'; // @todo: move to global constants

// @todo: move to global constants
const baseTimeoutMs = 5 * 1000; // 5 sec
const maxTimeoutMs = 20 * 60 * 1000; // 20 min
export const requiredCallbacksCount = 4;
export const creBatchSize = 40;
export const pumpBatchCountPerTick = 2;

// @todo: move to time utils
const msInMin = 60_000;
const creRequestExpirationMs = 5 * msInMin;
export const messageSubmissionExpirationMs = 3 * msInMin;

/* Job pipeline:
    PendingVerification
        ↓ (execute CRE request)
    PendingSubmit   ← waiting for callbacks (verification phase)
        ↓ (callbacksCount >= 4)
    PendingSubmit   ← ready to submit on-chain
        ↓ (submit success)
    WaitingDstFinality
 */
export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    private readonly creExecutorService: CREExecutorService;

    constructor(context: Context) {
        super('CREValidatorAdapter', context);
        this.creExecutorService = new CREExecutorService();
    }

    // pump only planned verification with rate limits based on constants
    async pumpPendingVerification(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingVerification,
                validatorType: ValidatorType.CRE,
                verificationPlannedTo: { lt: new Date() },
                // lastVerificationAt: { lt: new Date(Date.now() - creRequestExpirationMs) },
            },
            { take: size },
        );
        const allJobIds = jobs.map(i => i.id);

        this.logger.info(`Found ${jobs.length} jobs to verify`);

        if (!jobs.length) {
            return;
        }

        // set last verification requested date
        await this.context.jobQueue.updateMany(
            { id: { in: allJobIds } },
            {
                lastVerificationAt: new Date(),
            },
        );

        const batches = ArrayLib.toChunks(jobs, creBatchSize);

        const batchPromises = batches.map(async batch => {
            const batchJobIds = batch.map(i => i.id);

            try {
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
                        verificationAttempts: 0,
                        verificationPlannedTo: null,
                        submitPlannedTo: new Date(), // should be planned to just now
                    },
                );
            } catch (e) {
                this.logger.error(`pumpPendingVerification Execution failed: ${e}`);
                // move to verification request failed if batch was not executed
                await this.context.dbClient.$transaction(async client => {
                    const jobPromises = batch.map(async i => {
                        client.job.update({
                            where: { id: i.id },
                            data: {
                                status: JobStatus.FailedVerification,
                                verificationAttempts: { increment: 1 },
                                verificationPlannedTo: this.calculateNextPlannedTo(
                                    i.verificationAttempts + 1,
                                ),
                            },
                        });
                    });
                    await Promise.all(jobPromises);
                });
            }
        });
        await Promise.all(batchPromises);

        this.logger.info(`pumpPendingVerification took: ${(Date.now() - start) / 1000}s`);
    }

    // retry only failed verification request (verificationPlannedTo re-calc not needed, calculated in catch block of "pumpPendingVerification")
    async pumpFailedVerification(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                validatorType: ValidatorType.CRE,
                status: JobStatus.FailedVerification,
            },
            { take: size },
        );
        if (!jobs.length) {
            return;
        }

        const messageIds = jobs.map(i => i.messageId);

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

        this.logger.info(`pumpFailedVerification took: ${(Date.now() - start) / 1000}s`);
    }

    // retry verification in case request "expired" and we did not receive enough creCallbacks for it (verificationPlannedTo re-calc needed before moving to planned verification queue)
    async pumpStuckVerificationRequests(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingSubmit,
                validatorType: ValidatorType.CRE,
                lastVerificationAt: {
                    lt: new Date(Date.now() - creRequestExpirationMs),
                },
                callbacksCount: { lt: requiredCallbacksCount },
            },
            { take: size },
        );

        if (!jobs.length) {
            return;
        }

        this.logger.info(`${jobs.length} stuck requests.`);

        const messageIds = jobs.map(i => i.messageId);

        await this.context.dbClient.$transaction(async client => {
            await client.creCallback.deleteMany({
                where: { messageId: { in: messageIds } },
            });
            const jobs = await client.job.findMany({ where: { messageId: { in: messageIds } } });
            const jobPromises = jobs.map(i => {
                return client.job.update({
                    where: {
                        id: i.id,
                    },
                    data: {
                        status: JobStatus.PendingVerification,
                        callbacksCount: 0,
                        verificationPlannedTo: this.calculateNextPlannedTo(
                            i.verificationAttempts + 1,
                        ),
                        verificationAttempts: { increment: 1 },
                    },
                });
            });
            await Promise.all(jobPromises);
        });

        this.logger.info(`pumpStuckVerificationRequests took: ${(Date.now() - start) / 1000}s`);
    }

    async pumpPendingSubmit(size: number): Promise<void> {
        const start = Date.now();

        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingSubmit,
                validatorType: ValidatorType.CRE,
                callbacksCount: { gte: requiredCallbacksCount },
                submitPlannedTo: {
                    lt: new Date(),
                },
                // lastSubmitAt: {
                //     lt: new Date(Date.now() - messageSubmissionExpirationMs),
                // },
            },
            { take: size },
        );
        const allJobIds = jobs.map(i => i.id);
        if (!jobs.length) {
            return;
        }

        await this.context.jobQueue.updateMany(
            { id: { in: allJobIds } },
            { lastSubmitAt: new Date() },
        );

        const batches = ArrayLib.toChunks(jobs, 10);

        for (const batch of batches) {
            const batchPromises = batch.map(async item => {
                const jobId = item.id;
                const messageId = item.messageId as Hex;

                try {
                    const itemPayload = JSON.parse(item.payload) as JobPayload;
                    const callbacks = await this.context.dbClient.creCallback.findMany({
                        where: { messageId },
                        take: 4,
                    });
                    const validation = this.packCREValidationFromResponse(
                        callbacks.map(c => JSON.parse(c.payload)),
                        messageId,
                    );
                    this.logger.info(
                        `pumpPendingSubmit Processing Message (id=${messageId}, jobId=${jobId}) submit to chain (selector=${item.dstChainSelector})`,
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

                    return { jobId, type: 'success', dst };
                } catch (e) {
                    this.logger.error(
                        `pumpPendingSubmit Message (id=${messageId}, jobId=${jobId}) submit failed: ${e}`,
                    );
                    return { jobId, type: 'failed', attempts: item.submitAttempts };
                }
            });
            const results = await Promise.all(batchPromises);
            const successResults = results.filter(i => i.type === 'success');
            const failedResults = results.filter(i => i.type === 'failed');

            await this.context.dbClient.$transaction(async client => {
                const successPromises = successResults.map(i => {
                    return client.job.update({
                        where: { id: i.jobId },
                        data: {
                            status: JobStatus.WaitingDstFinality,
                            submitAttempts: 0,
                            submitPlannedTo: null,
                            dstBlockNumber: String(i?.dst?.blockNumber),
                            dstTxHash: String(i?.dst?.hash),
                        },
                    });
                });
                const failedPromises = failedResults.map(i => {
                    return client.job.update({
                        where: { id: i.jobId },
                        data: {
                            submitPlannedTo: this.calculateNextPlannedTo(
                                (i.attempts as number) + 1,
                            ),
                            submitAttempts: { increment: 1 },
                        },
                    });
                });
                const totalPromises = successPromises.concat(failedPromises);
                await Promise.all(totalPromises);
            });
        }

        this.logger.info(`pumpPendingSubmit took: ${(Date.now() - start) / 1000}s`);
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

    private calculateNextPlannedTo(attempts: number): Date {
        const delay = Math.min(baseTimeoutMs * 2 ** attempts, maxTimeoutMs);

        // to avoid DDoS due to critical issue we use jitter (randomizer for delay)
        const jitter = delay * (0.5 + Math.random() * 0.5);

        return new Date(Date.now() + jitter);
    }
}
