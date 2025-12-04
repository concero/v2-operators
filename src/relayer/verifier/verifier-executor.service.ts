import { CREVerifierStrategy, VerifierStrategy, VerifierType } from './strategies';
import { VerifierModule } from './verifier.module';

import { ContextProvider, JobQueue } from '../services';
import { Context } from '../types';

export class VerifierExecutorService extends ContextProvider {
    private readonly strategies: Record<VerifierType, VerifierStrategy>;
    private readonly jobQueue: JobQueue;

    constructor(context: Context, jobQueue: JobQueue) {
        super('VerifierExecutorService', context);
        this.strategies = {
            [VerifierType.CRE]: new CREVerifierStrategy(context, jobQueue),
            [VerifierType.Empty]: new CREVerifierStrategy(context, jobQueue),
        };
        this.jobQueue = jobQueue;
    }

    private async requestVerification(
        payload: VerifierStrategy.Payload,
        onError: (payload: VerifierStrategy.Payload) => Promise<void>,
        onSuccess?: (messageId: VerifierStrategy.Payload['data']) => Promise<void>,
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] requesting ${payload.type}`);
            await this.strategies[payload.type].requestVerification(payload);
            await onSuccess?.(payload.data);
            this.logger.info(
                `[${payload.type}] Requested successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Request failed: ${e}`);
            await onError(payload);
        }
    }

    private async confirmVerification(
        payload: VerifierStrategy.Payload,
        onError: (payload: VerifierStrategy.Payload) => Promise<void>,
        onSuccess?: (messageId: VerifierStrategy.Payload['data']) => Promise<void>,
    ): Promise<void> {
        try {
            this.logger.info(`[${payload.type}] processing ${payload.type}`);
            await this.strategies[payload.type].confirmVerification(payload);
            await onSuccess?.(payload.data);
            this.logger.info(
                `[${payload.type}] Confirmed successfully ${payload.type} with id = ${payload.data.messageId}`,
            );
        } catch (e) {
            this.logger.error(`[${payload.type}] Confirm failed: ${e}`);
            await onError(payload);
        }
    }

    private async pumpRequestRetries() {}

    async init() {
        // events facade
        this.context.eventBus.on(
            VerifierModule.Request.command,
            (payload: VerifierModule.Request.Payload) =>
                this.requestVerification(payload, payload =>
                    this.jobQueue.add(
                        payload.data.messageId,
                        payload.data.parsedReceipt.dstChainSelector,
                        payload,
                    ),
                ),
        );
        this.context.eventBus.on(
            VerifierModule.Confirm.command,
            (payload: VerifierModule.Confirm.Payload) =>
                this.confirmVerification(payload, payload =>
                    this.jobQueue.add(
                        payload.data.messageId,
                        payload.data.parsedReceipt.dstChainSelector,
                        payload,
                    ),
                ),
        );

        // retries
        setInterval(async () => {
            const jobs = await this.jobQueue.getDue(10);

            for (const job of jobs) {
                const payload: VerifierStrategy.Payload = JSON.parse(job.payload);
                await this.requestVerification(
                    payload,
                    () => this.jobQueue.reschedule(job.id, job.attempts),
                    () => this.jobQueue.markSuccess(job.id),
                );
            }
        }, 15_000);
    }
}
