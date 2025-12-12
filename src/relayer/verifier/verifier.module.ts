import { LoggerInterface } from '@concero/operator-utils';
import { CREVerifierStrategy, VerifierStrategy, VerifierType } from './strategies';
import { VerifierApiService } from './verifer-api.service';
import { VerifierExecutorService } from './verifier-executor.service';

import { Context, JobStatus } from '../types';

export class VerifierModule {
    private readonly context: Context;
    private readonly logger: LoggerInterface;
    private readonly verifierApiService: VerifierApiService;
    private readonly verifierExecutorService: VerifierExecutorService;

    constructor(context: Context) {
        this.context = context;
        this.logger = this.context.logger.getLogger('VerifierModule');
        this.verifierExecutorService = new VerifierExecutorService(context);
        this.verifierApiService = new VerifierApiService(
            context,
            this.verifierExecutorService.getStrategy(VerifierType.CRE) as CREVerifierStrategy,
        );
    }

    // infinite retry calls
    private async pumpFailedRequestRetries() {
        const failedRequests = await this.context.jobQueue.getDueByNextRetry(
            10,
            JobStatus.RequestFailed,
        );

        await Promise.all(
            failedRequests.map(async job =>
                this.verifierExecutorService.safeRequestVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    private async pumpConfirmRetries() {
        const failedConfirms = await this.context.jobQueue.getDueByNextRetry(
            10,
            JobStatus.ConfirmFailed,
        );

        await Promise.all(
            failedConfirms.map(async job =>
                this.verifierExecutorService.safeConfirmVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    private async pumpCallbacksTimeouts() {
        const failedCallbacks = await this.context.jobQueue.getDueByCallbackTimeouts(10);
        this.logger.info(
            `Failed callbacks by timeouts: ${failedCallbacks.map(i => i.id).join(', ')}`,
        );
        await Promise.all(
            failedCallbacks.map(async job => {
                const payload = JSON.parse(job.payload) as VerifierModule.Request.Payload;
                if ('callbacks' in payload) {
                    delete payload.callbacks;
                }

                await this.context.jobQueue.update(
                    payload.data.messageId,
                    payload,
                    JobStatus.ProcessingRequest,
                );
            }),
        );
    }

    async init() {
        // events facade
        this.context.eventBus.on(
            VerifierModule.Request.command,
            (payload: VerifierModule.Request.Payload) =>
                this.verifierExecutorService.safeRequestVerification(payload),
        );
        this.context.eventBus.on(
            VerifierModule.Confirm.command,
            (payload: VerifierModule.Confirm.Payload) =>
                this.verifierExecutorService.safeConfirmVerification(payload),
        );

        // infinite retries for request & confirm
        setInterval(async () => this.pumpCallbacksTimeouts(), 2 * 60_000);
        setInterval(async () => this.pumpFailedRequestRetries(), 15_000);
        setInterval(async () => this.pumpConfirmRetries(), 15_000);

        // setup api
        await this.verifierApiService.init();
    }
}

export namespace VerifierModule {
    export namespace Request {
        export const command = 'request_verification';
        export type Payload = VerifierStrategy.Payload & {
            type: VerifierType;
        };
    }
    export namespace Confirm {
        export const command = 'confirm_verification';
        export type Payload = VerifierStrategy.Payload & {
            type: VerifierType;
        };
    }
}
