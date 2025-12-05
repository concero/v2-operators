import {
    CREVerifierStrategy,
    EmptyVerifierStrategy,
    VerifierStrategy,
    VerifierType,
} from './strategies';
import { VerifierModule } from './verifier.module';
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

    getStrategy(type: VerifierType): VerifierStrategy {
        return this.strategies[type];
    }

    // wrapped strategy calls

    private async requestVerification(
        payload: VerifierModule.Request.Payload,
        options: {
            onError: (payload: VerifierModule.Request.Payload) => Promise<void>;
            onSuccess: (messageId: VerifierModule.Request.Payload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] requesting ${payload.type}`);
            await this.getStrategy(payload.type).requestVerification(payload);
            await options.onSuccess(payload);
            this.logger.info(
                `[${payload.type}] Requested successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Request failed: ${e}`);
            await options.onError(payload);
        }
    }

    private async confirmVerification(
        payload: VerifierModule.Confirm.Payload,
        options: {
            onError: (payload: VerifierModule.Confirm.Payload) => Promise<void>;
            onSuccess: (messageId: VerifierModule.Confirm.Payload) => Promise<void>;
        },
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] confirming ${payload.type}`);
            await this.getStrategy(payload.type).confirmVerification(payload);
            await options.onSuccess(payload);
            this.logger.info(
                `[${payload.type}] Confirmed successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Confirm failed: ${e}`);
            await options.onError(payload);
        }
    }

    // retries & job status aggregation based on strategy calls

    async safeRequestVerification(
        payload: VerifierModule.Request.Payload,
        job?: Job,
    ): Promise<void> {
        return this.requestVerification(payload, {
            onSuccess: async payload => {
                if (job) {
                    await this.context.jobQueue.changeStatus(job.id, JobStatus.ProcessingConfirm);
                } else {
                    await this.context.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.ProcessingConfirm,
                    );
                }

                if (payload.type !== VerifierType.CRE) {
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
                    await this.context.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.RequestFailed,
                    );
                }
            },
        });
    }

    async safeConfirmVerification(
        payload: VerifierModule.Confirm.Payload,
        job?: Job,
    ): Promise<void> {
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
                    await this.context.jobQueue.add(
                        payload.data.messageId,
                        payload,
                        JobStatus.ConfirmFailed,
                    );
                }
            },
        });
    }
}
