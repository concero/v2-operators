import { CREVerifierAdapter } from './cre-verifier.adapter';
import { EmptyVerifierAdapter } from './empty-verifier.adapter';
import { VerifierAdapter, VerifierType } from './types';
import fastify, { FastifyInstance } from 'fastify';

import { ContextProvider, RetryQueueService } from '../services';
import { Context } from '../types';

export class VerifierProcessor extends ContextProvider {
    private readonly retryQueue: RetryQueueService;
    private readonly adapters: Record<VerifierType, VerifierAdapter>;
    private readonly app: FastifyInstance;

    constructor(context: Context) {
        super('VerifierProcessor', context);
        this.retryQueue = new RetryQueueService(this.context);
        this.adapters = {
            [VerifierType.Empty]: new EmptyVerifierAdapter(this.context, this.retryQueue),
            [VerifierType.CRE]: new CREVerifierAdapter(this.context, this.retryQueue),
        };
        this.app = fastify({ logger: true });
    }

    private async requestVerification(
        payload: VerifierProcessor.Payload,
        onError: (payload: VerifierProcessor.Payload['data']) => Promise<void>,
        onSuccess?: (messageId: VerifierProcessor.Payload['data']) => Promise<void>,
    ): Promise<void> {
        try {
            this.logger.debug(`processing ${payload.type}`);
            await this.adapters[payload.type].requestVerification(payload);
            await onSuccess?.(payload.data);
        } catch (e) {
            this.logger.error(`Processing failed: ${e}`);
            await onError(payload.data);
        }
    }

    private startListener() {
        const requestVerification = this.requestVerification.bind(this);
        this.context.eventBus.on(VerifierProcessor.command, (payload: VerifierProcessor.Payload) =>
            requestVerification(payload, payload =>
                this.retryQueue.add(
                    payload.messageId,
                    payload.parsedReceipt.dstChainSelector,
                    payload,
                ),
            ),
        );
    }

    private startPolling() {
        const requestVerification = this.requestVerification.bind(this);

        setInterval(async () => {
            const jobs = await this.retryQueue.getDue(10);

            for (const job of jobs) {
                const payload: VerifierProcessor.Payload = JSON.parse(job.payload);
                await requestVerification(
                    payload,
                    () => this.retryQueue.reschedule(job.id, job.attempts),
                    () => this.retryQueue.markSuccess(job.id),
                );
            }
        }, 15_000);
    }

    private setupApi() {
        this.app.get('/api/v1/callback/cre', async (req, res) => {
            try {
                await (this.adapters.cre as CREVerifierAdapter).confirmVerification(
                    req.body as CREVerifierAdapter.ConfirmResponse,
                );
            } catch (e) {
                res.send('error');
            }
            res.send('ok');
        });
        this.app.listen({ port: 3000, host: '0.0.0.0' }).catch(console.error);
    }

    init() {
        this.startPolling();
        this.startListener();
        this.setupApi();
    }
}

export namespace VerifierProcessor {
    export const command = 'request_message_report';
    export type Payload = VerifierAdapter.Payload & {
        type: VerifierType;
    };
}
