import { ConceroNetwork } from '@concero/operator-utils';
import { CLFVerifierAdapter } from './clf-verifier.adapter';
import { CREVerifierAdapter } from './cre-verifier.adapter';
import { ReportJobQueue } from './report-job-queue';
import { VerifierAdapter, VerifierType } from './types';

import { RelayerContext } from '../relayer-context';
import { Context } from '../types';

export class VerifierProcessor extends RelayerContext {
    private readonly reportJobQueue: ReportJobQueue;
    private readonly adapters: Record<VerifierType, VerifierAdapter>;

    constructor(context: Context) {
        super('VerifierProcessor', context);
        this.reportJobQueue = new ReportJobQueue(this.context);
        this.adapters = {
            [VerifierType.CLF]: new CLFVerifierAdapter(this.context, this.reportJobQueue),
            [VerifierType.CRE]: new CREVerifierAdapter(this.context, this.reportJobQueue),
        };
    }

    startListener() {
        this.context.eventEmitter.on(
            VerifierProcessor.RequestMessageReport.command,
            (payload: VerifierProcessor.RequestMessageReport.Payload) =>
                this.adapters[payload.type].requestMessageReport(payload),
        );
    }

    startPolling() {
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
                    await this.adapters[payload.type].requestMessageReport(payload);
                } catch (err) {
                    this.logger.error(`[report-request] error: ${err}`);
                    await this.reportJobQueue.reschedule(job.id, job.attempts);
                }

                const dstChain: ConceroNetwork = this.context.network.getNetworkByName(
                    payload.chainName,
                );
                if (!dstChain) {
                    this.logger.error(`[${payload.chainName}] Retry failed: no network`);
                    await this.reportJobQueue.markFailed(job.id, job.attempts);
                    continue;
                }

                try {
                    this.logger.info(
                        `[${payload.chainName}] Retrying job ${job.id} (attempt ${job.attempts + 1})`,
                    );
                    const newTxHash = await this.submitBatchToDestination(
                        dstChain,
                        reportSubmission,
                        messages,
                        indexes,
                        results,
                        totalGasLimit,
                    );
                    this.logger.info(`[${payload.chainName}] Retry success: ${newTxHash}`);
                    await this.reportJobQueue.markSuccess(job.id);
                } catch (err) {
                    this.logger.error(`[${payload.chainName}] Retry error: ${err}`);
                    await this.reportJobQueue.markFailed(job.id, job.attempts + 1);
                }
            }
        }, 15_000);
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
