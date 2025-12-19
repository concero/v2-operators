import {
    CREVerifierStrategy,
    EmptyVerifierStrategy,
    VerifierStrategy,
    VerifierType,
} from './strategies';
import { Job } from '@prisma/client';

import { ContextProvider } from '../services';
import { Context, JobPayload, JobStatus } from '../types';

export class VerifierExecutorService extends ContextProvider {
    private readonly strategies: Record<VerifierType, VerifierStrategy>;

    constructor(context: Context) {
        super('VerifierExecutorService', context);
        this.strategies = {
            [VerifierType.CRE]: new CREVerifierStrategy(context),
            [VerifierType.Empty]: new EmptyVerifierStrategy(context),
        };

        (this.strategies.cre as CREVerifierStrategy).init();
    }

    getStrategy(verifierType: VerifierType): VerifierStrategy {
        return this.strategies[verifierType];
    }

    // wrapped strategy calls

    private async requestVerification(
        payload: JobPayload,
        {
            onError,
            onSuccess,
        }: {
            onError: (payload: JobPayload) => Promise<void>;
            onSuccess: (messageId: JobPayload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.verifierType}] requesting ${payload.verifierType}`);
            await this.getStrategy(payload.verifierType).requestVerification(payload);
            await onSuccess(payload);
            this.logger.info(
                `[${payload.verifierType}] Requested successfully ${payload.verifierType} with [messageId=${payload.data.messageId}]`,
            );
        } catch (e) {
            this.logger.error(`[${payload.verifierType}] Request failed: ${e}`);
            await onError(payload);
        }
    }

    private async confirmVerification(
        payload: JobPayload,
        {
            onError,
            onSuccess,
        }: {
            onError: (payload: JobPayload) => Promise<void>;
            onSuccess: (messageId: JobPayload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.verifierType}] confirming ${payload.verifierType}`);
            await this.getStrategy(payload.verifierType).confirmVerification(payload);
            await onSuccess(payload);
            this.logger.info(
                `[${payload.verifierType}] Confirmed successfully ${payload.verifierType} with [messageId=${payload.data.messageId}]`,
            );
        } catch (e) {
            this.logger.error(`[${payload.verifierType}] Confirm failed: ${e}`);
            await onError(payload);
        }
    }

    // retries & job status aggregation based on strategy calls

    async safeRequestVerification(payload: JobPayload, job?: Job): Promise<void> {
        return this.requestVerification(payload, {
            onSuccess: async payload => {
                if (job) {
                    await this.context.jobQueue.updateOne(
                        { id: job.id },
                        { status: JobStatus.ProcessingConfirm },
                    );
                } else {
                    await this.context.jobQueue.create(
                        payload.data.messageId,
                        payload.parsedReceipt.srcChainSelector,
                        payload,
                        JobStatus.ProcessingConfirm,
                    );
                }

                if (payload.verifierType === VerifierType.Empty) {
                    this.context.eventBus.confirmVerification(payload);
                }
            },
            onError: async () => {
                if (job) {
                    await this.context.jobQueue.reschedule(
                        job.id,
                        job.attempts,
                        JobStatus.RequestFailed,
                    );
                } else {
                    await this.context.jobQueue.create(
                        payload.data.messageId,
                        payload.parsedReceipt.srcChainSelector,
                        payload,
                        JobStatus.RequestFailed,
                    );
                }
            },
        });
    }

    async safeConfirmVerification(payload: JobPayload, job?: Job): Promise<void> {
        return this.confirmVerification(payload, {
            onSuccess: async () => {
                if (job) {
                    await this.context.jobQueue.updateOne(
                        { id: job.id },
                        { status: JobStatus.WaitingTxFinality },
                    );
                } else {
                    this.logger.error(
                        `Log(${payload?.data?.messageId}) was success but not upserted to db`,
                    );
                }
            },
            onError: async () => {
                if (job) {
                    await this.context.jobQueue.reschedule(
                        job.id,
                        job.attempts,
                        JobStatus.ConfirmFailed,
                    );
                } else {
                    await this.context.jobQueue.create(
                        payload.data.messageId,
                        payload.parsedReceipt.srcChainSelector,
                        payload,
                        JobStatus.ConfirmFailed,
                    );
                }
            },
        });
    }
}
