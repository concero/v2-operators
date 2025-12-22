import { LoggerInterface } from '@concero/operator-utils';
import { CREVerifierStrategy, ValidatorType } from './strategies';
import { ValidatorApiService } from './validator-api.service';
import { ValidatorExecutorService } from './validator-executor.service';

import { Context, JobPayload, JobStatus } from '../types';

export class ValidatorModule {
    private readonly context: Context;
    private readonly logger: LoggerInterface;
    private readonly api: ValidatorApiService;
    private readonly verifierExecutorService: ValidatorExecutorService;

    constructor(context: Context) {
        this.context = context;
        this.logger = this.context.logger.getLogger('ValidatorModule');
        this.verifierExecutorService = new ValidatorExecutorService(context);
        this.api = new ValidatorApiService(
            context,
            this.verifierExecutorService.getStrategy(ValidatorType.CRE) as CREVerifierStrategy,
        );
    }

    // infinite retry calls
    private async pumpFailedRequestRetries() {
        const failedRequestJobs = await this.context.jobQueue.getList(
            {
                nextRetryAt: { lte: new Date() },
                status: JobStatus.RequestFailed,
            },
            { take: 10 },
        );

        await Promise.all(
            failedRequestJobs.map(async job =>
                this.verifierExecutorService.safeRequestVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    private async pumpConfirmRetries() {
        const failedConfirmJobs = await this.context.jobQueue.getList(
            {
                nextRetryAt: { lte: new Date() },
                status: JobStatus.ConfirmFailed,
            },
            { take: 10 },
        );

        await Promise.all(
            failedConfirmJobs.map(async job =>
                this.verifierExecutorService.safeConfirmVerification(JSON.parse(job.payload), job),
            ),
        );
    }

    private async pumpCallbacksTimeouts() {
        const failedCallbackJobs = await this.context.jobQueue.getList({
            status: JobStatus.ProcessingConfirm,
            updatedAt: {
                // updated then 5 min ago and later
                lte: new Date(Date.now() - 6 * 50_000),
            },
        });
        // if empty => just return
        if (!failedCallbackJobs.length) {
            return;
        }

        this.logger.info(
            `Callbacks timeout jobs: [ids=${failedCallbackJobs.map(i => i.id).join(',')}]`,
        );

        await Promise.all(
            failedCallbackJobs.map(async job => {
                const payload = JSON.parse(job.payload) as JobPayload;
                if ('callbacks' in payload) {
                    delete payload.callbacks;
                }

                await this.context.jobQueue.updateOne(
                    { messageId: payload.data.messageId },
                    { payload: JSON.stringify(payload), status: JobStatus.ProcessingRequest },
                );
            }),
        );
    }

    async init() {
        // infinite retries for request & confirm
        setInterval(async () => this.pumpCallbacksTimeouts(), 120_000);
        setInterval(async () => this.pumpFailedRequestRetries(), 30_000);
        setInterval(async () => this.pumpConfirmRetries(), 15_000);
    }
}

export namespace VerifierModule {
    export namespace Request {
        export const command = 'request_verification';
    }
    export namespace Confirm {
        export const command = 'confirm_verification';
    }
}
