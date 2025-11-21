import { CREVerifierAdapter } from './cre-verifier.adapter';
import { EmptyVerifierAdapter } from './empty-verifier.adapter';
import { VerifierAdapter, VerifierType } from './types';

import { ContextProvider, RetryQueueService } from '../services';
import { Context } from '../types';

export class VerifierProcessor extends ContextProvider {
    private readonly retryQueue: RetryQueueService;
    private readonly adapters: Record<VerifierType, VerifierAdapter>;

    constructor(context: Context) {
        super('VerifierProcessor', context);
        this.retryQueue = new RetryQueueService(this.context);
        this.adapters = {
            [VerifierType.Empty]: new EmptyVerifierAdapter(this.context, this.retryQueue),
            [VerifierType.CRE]: new CREVerifierAdapter(this.context, this.retryQueue),
        };
    }

    private async process(
        payload: VerifierProcessor.Payload,
        onError: (payload: VerifierProcessor.Payload['data']) => Promise<void>,
        onSuccess?: (messageId: VerifierProcessor.Payload['data']) => Promise<void>,
    ): Promise<void> {
        try {
            this.logger.debug(`processing ${payload.type}`);
            await this.adapters[payload.type].process(payload);
            await onSuccess?.(payload.data);
        } catch (e) {
            this.logger.error(`Processing failed: ${e}`);
            await onError(payload.data);
        }
    }

    private startListener() {
        const process = this.process.bind(this);
        this.context.eventEmitter.on(
            VerifierProcessor.command,
            (payload: VerifierProcessor.Payload) =>
                process(payload, payload =>
                    this.retryQueue.add(
                        payload.messageId,
                        payload.parsedReceipt.dstChainSelector,
                        payload,
                    ),
                ),
        );
    }

    private startPolling() {
        const process = this.process.bind(this);

        setInterval(async () => {
            const jobs = await this.retryQueue.getDue(10);

            for (const job of jobs) {
                const payload: VerifierProcessor.Payload = JSON.parse(job.payload);
                await process(
                    payload,
                    () => this.retryQueue.reschedule(job.id, job.attempts),
                    () => this.retryQueue.markSuccess(job.id),
                );
            }
        }, 15_000);
    }

    init() {
        this.startPolling();
        this.startListener();
    }
}

export namespace VerifierProcessor {
    export const command = 'request_message_report';
    export type Payload = VerifierAdapter.Payload & {
        type: VerifierType;
    };
}
