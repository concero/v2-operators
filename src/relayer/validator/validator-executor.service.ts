import {
    CREVerifierStrategy,
    EmptyVerifierStrategy,
    ValidatorType,
    VerifierStrategy,
    VerifierType,
} from './strategies';
import { Job } from '@prisma/client';

import { ContextProvider } from '../services';
import { Context, JobPayload, JobStatus } from '../types';

export class ValidatorExecutorService extends ContextProvider {
    private readonly strategies: Record<VerifierType, VerifierStrategy>;

    constructor(context: Context) {
        super('ValidatorExecutorService', context);
        this.strategies = {
            [VerifierType.CRE]: new CREVerifierStrategy(context),
            [VerifierType.Empty]: new EmptyVerifierStrategy(context),
        };

        (this.strategies.cre as CREVerifierStrategy).init();
    }

    getStrategy(validatorType: ValidatorType): VerifierStrategy {
        return this.strategies[validatorType];
    }

    // retries & job status aggregation based on strategy calls

    async requestVerification(payload: JobPayload, job: Job): Promise<void> {
        try {
            this.logger.info(`[${payload.verifierType}] requesting ${payload.verifierType}`);
            await this.getStrategy(payload.verifierType).requestVerification(payload);
            this.logger.info(
                `[${payload.verifierType}] Requested successfully ${payload.verifierType} with [messageId=${payload.data.messageId}]`,
            );
            await this.context.jobQueue.updateOne(
                { id: job.id },
                { status: JobStatus.ProcessingConfirm },
            );
        } catch (e) {
            this.logger.error(`[${payload.verifierType}] Request failed: ${e}`);
            await this.context.jobQueue.reschedule(job.id, job.attempts, JobStatus.RequestFailed);
        }
    }

    async approveVerification(payload: JobPayload, job: Job): Promise<void> {
        try {
            this.logger.info(`[${payload.verifierType}] confirming ${payload.verifierType}`);
            await this.getStrategy(payload.verifierType).confirmVerification(payload);
            this.logger.info(
                `[${payload.verifierType}] Confirmed successfully ${payload.verifierType} with [messageId=${payload.data.messageId}]`,
            );

            await this.context.jobQueue.updateOne(
                { id: job.id },
                { status: JobStatus.WaitingTxFinality },
            );
        } catch (e) {
            this.logger.error(`[${payload.verifierType}] Confirm failed: ${e}`);

            await this.context.jobQueue.reschedule(job.id, job.attempts, JobStatus.ConfirmFailed);
        }
    }
}
