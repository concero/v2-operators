import { CREVerifierAdapter } from './cre-verifier.adapter';
import { EmptyVerifierAdapter } from './empty-verifier.adapter';
import { ReportJobQueue } from './report-job-queue';
import { VerifierAdapter, VerifierType } from './types';

import { ContextProvider } from '../services';
import { Context } from '../types';

export class VerifierProcessor extends ContextProvider {
    private readonly reportJobQueue: ReportJobQueue;
    private readonly adapters: Record<VerifierType, VerifierAdapter>;

    constructor(context: Context) {
        super('VerifierProcessor', context);
        this.reportJobQueue = new ReportJobQueue(this.context);
        this.adapters = {
            [VerifierType.Empty]: new EmptyVerifierAdapter(this.context, this.reportJobQueue),
            [VerifierType.CRE]: new CREVerifierAdapter(this.context, this.reportJobQueue),
        };
    }

    private startListener() {
        this.context.eventEmitter.on(
            VerifierProcessor.RequestMessageReport.command,
            (payload: VerifierProcessor.RequestMessageReport.Payload) =>
                this.adapters[payload.type].process(payload),
        );
    }

    private startPolling() {
        setInterval(async () => {
            const jobs = await this.reportJobQueue.getDue(10);

            for (const job of jobs) {
                const payload: VerifierProcessor.RequestMessageReport.Payload = JSON.parse(
                    job.payload,
                );

                try {
                    this.logger.info(
                        `Job retry #${job.attempts + 1} for messageId=${job.messageId}`,
                    );
                    void this.adapters[payload.type].process(payload);
                } catch (err) {
                    this.logger.error(`[report-request] error: ${err}`);
                    await this.reportJobQueue.reschedule(job.id, job.attempts);
                }
            }
        }, 15_000);
    }

    setup() {
        this.startPolling();
        this.startListener();
    }
}

export namespace VerifierProcessor {
    export namespace RequestMessageReport {
        export const command = 'request_message_report';
        export type Payload = VerifierAdapter.Payload & {
            type: VerifierType;
        };
    }
}
