import { CREVerifierStrategy, VerifierStrategy, VerifierType } from './strategies';
import { VerifierModule } from './verifier.module';
import { Job } from '@prisma/client';

import { ContextProvider, JobQueue } from '../services';
import { Context, JobStatus } from '../types';

export class VerifierExecutorService extends ContextProvider {
    private readonly strategies: Record<VerifierType, VerifierStrategy>;
    private readonly jobQueue: JobQueue;

    constructor(context: Context, jobQueue: JobQueue) {
        super('VerifierExecutorService', context);
        this.strategies = {
            [VerifierType.CRE]: new CREVerifierStrategy(context),
            [VerifierType.Empty]: new CREVerifierStrategy(context),
        };
        this.jobQueue = jobQueue;
    }

    // wrapped strategy calls

    private async requestVerification(
        payload: VerifierModule.Request.Payload,
        options?: {
            onError?: (payload: VerifierModule.Request.Payload) => Promise<void>;
            onSuccess?: (messageId: VerifierModule.Request.Payload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] requesting ${payload.type}`);
            await this.strategies[payload.type].requestVerification(payload);
            await options?.onSuccess?.(payload);
            this.logger.info(
                `[${payload.type}] Requested successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Request failed: ${e}`);
            await options?.onError?.(payload);
        }
    }

    private async confirmVerification(
        payload: VerifierModule.Confirm.Payload,
        options?: {
            onError?: (payload: VerifierModule.Confirm.Payload) => Promise<void>;
            onSuccess?: (messageId: VerifierModule.Confirm.Payload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] confirming ${payload.type}`);
            await this.strategies[payload.type].confirmVerification(payload);
            await options?.onSuccess?.(payload);
            this.logger.info(
                `[${payload.type}] Confirmed successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Confirm failed: ${e}`);
            await options?.onError?.(payload);
        }
    }

    // retries & job status aggregation based on strategy calls

    private async safeRequestVerification(
        payload: VerifierModule.Request.Payload,
        job?: Job,
    ): Promise<void> {
        return this.requestVerification(payload, {
            onSuccess: async payload => {
                if (job) {
                    await this.jobQueue.changeStatus(job.id, JobStatus.ProcessingConfirm);
                } else {
                    await this.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.ProcessingConfirm,
                    );
                }
                this.context.eventBus.confirmVerification(payload);
            },
            onError: async () => {
                if (job) {
                    await this.jobQueue.reschedule(job.id, job.attempts, JobStatus.RequestFailed);
                } else {
                    await this.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.RequestFailed,
                    );
                }
            },
        });
    }

    private async safeConfirmVerification(
        payload: VerifierModule.Confirm.Payload,
        job?: Job,
    ): Promise<void> {
        return this.confirmVerification(payload, {
            onSuccess: async () => {
                if (job) {
                    await this.jobQueue.markSuccess(job.id);
                }
            },
            onError: async () => {
                if (job) {
                    await this.jobQueue.reschedule(job.id, job.attempts, JobStatus.ConfirmFailed);
                } else {
                    await this.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.ConfirmFailed,
                    );
                }
            },
        });
    }

    // infinite retry calls

    private async pumpRequestRetries() {
        const failedRequests = await this.jobQueue.getDue(10, JobStatus.RequestFailed);

        await Promise.all(
            failedRequests.map(async job =>
                this.safeRequestVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    private async pumpConfirmRetries() {
        const failedConfirms = await this.jobQueue.getDue(10, JobStatus.RequestFailed);

        await Promise.all(
            failedConfirms.map(async job =>
                this.safeConfirmVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    async init() {
        // events facade
        this.context.eventBus.on(
            VerifierModule.Request.command,
            (payload: VerifierModule.Request.Payload) => this.safeRequestVerification(payload),
        );
        this.context.eventBus.on(
            VerifierModule.Confirm.command,
            (payload: VerifierModule.Confirm.Payload) => this.safeConfirmVerification(payload),
        );

        // infinite retries for request & confirm
        setInterval(async () => this.pumpRequestRetries(), 15_000);
        setInterval(async () => this.pumpConfirmRetries(), 15_000);
    }
}
