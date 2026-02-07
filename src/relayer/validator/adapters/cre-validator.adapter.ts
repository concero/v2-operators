import { Hex } from 'viem';
import { IValidatorAdapter } from './validator-adapter.interface';

import { CRE, JobStatus } from '../../../types';
import { ArrayLib } from '../../../utils';
import { CREExecutorService } from '../../services';
import { Context, ValidatorType } from '../../types';
import { BaseValidatorService } from '../base-validator.service'; // @todo: move to global constants

// @todo: move to global constants
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
export class CREValidatorAdapter extends BaseValidatorService implements IValidatorAdapter {
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
                OR: [
                    { lastVerificationAt: { lt: new Date(Date.now() - creRequestExpirationMs) } },
                    { lastVerificationAt: null },
                ],
            },
            { take: size },
        );

        this.logger.info(`Found ${jobs.length} jobs to verify`);

        if (!jobs.length) {
            return;
        }

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
                        lastVerificationAt: new Date(),
                        submitPlannedTo: new Date(), // should be planned to just now
                    },
                );
            } catch (e) {
                this.logger.error(`pumpPendingVerification Execution failed: ${e}`);
                // move to verification request failed if batch was not executed
                await this.context.dbClient.$transaction(async client => {
                    const jobPromises = batch.map(async i =>
                        client.job.update({
                            where: { id: i.id },
                            data: {
                                status: JobStatus.FailedVerification,
                                verificationAttempts: { increment: 1 },
                                verificationPlannedTo: this.calculateNextPlannedTo(
                                    i.verificationAttempts + 1,
                                ),
                            },
                        }),
                    );
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
            await Promise.all([
                client.creCallback.deleteMany({
                    where: {
                        messageId: {
                            in: messageIds,
                        },
                    },
                }),
                client.job.updateMany({
                    where: {
                        messageId: { in: messageIds },
                    },
                    data: {
                        status: JobStatus.PendingVerification,
                        callbacksCount: 0,
                    },
                }),
            ]);
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
}
