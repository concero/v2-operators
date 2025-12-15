import {
    CREVerifierStrategy,
    EmptyVerifierStrategy,
    VerifierStrategy,
    VerifierType,
} from './strategies';
import { Job } from '@prisma/client';

import { ContextProvider } from '../services';
import { Context, JobStatus } from '../types';

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
        payload: VerifierStrategy.Payload,
        {
            onError,
            onSuccess,
        }: {
            onError: (payload: VerifierStrategy.Payload) => Promise<void>;
            onSuccess: (messageId: VerifierStrategy.Payload) => Promise<void>;
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
        payload: VerifierStrategy.Payload,
        {
            onError,
            onSuccess,
        }: {
            onError: (payload: VerifierStrategy.Payload) => Promise<void>;
            onSuccess: (messageId: VerifierStrategy.Payload) => Promise<void>;
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

    async safeRequestVerification(payload: VerifierStrategy.Payload, job?: Job): Promise<void> {
        return this.requestVerification(payload, {
            onSuccess: async payload => {
                if (job) {
                    await this.context.jobQueue.changeStatus(job.id, JobStatus.ProcessingConfirm);
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

    async safeConfirmVerification(payload: VerifierStrategy.Payload, job?: Job): Promise<void> {
        return this.confirmVerification(payload, {
            onSuccess: async () => {
                if (job) {
                    await this.context.jobQueue.markSuccess(job.id);
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
