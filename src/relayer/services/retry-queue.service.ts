import { ContextProvider } from './index';

import { Context } from '../types';

const REPORT_RETRY_1M_COUNT = 4;
const reportDelaySec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300);
const saveJsonStringify = (object: Record<string, unknown>): string => {
    return JSON.stringify(object, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
};

export class RetryQueueService extends ContextProvider {
    constructor(context: Context) {
        super('ReportJobQueue', context);
    }

    async getDue(limit = 10) {
        return this.context.dbClient.job.findMany({
            where: { nextRetryAt: { lte: new Date() } },
            orderBy: { id: 'asc' },
            take: limit,
        });
    }

    async markSuccess(id: number) {
        await this.context.dbClient.job.delete({ where: { id } });
    }

    async add(messageId: string, chainSelector: number, payload: any, firstDelaySec = 60) {
        const next = new Date(Date.now() + firstDelaySec * 1000);
        await this.context.dbClient.job.upsert({
            where: { messageId },
            update: {
                chainSelector,
                payload: saveJsonStringify(payload),
                nextRetryAt: next,
            },
            create: {
                chainSelector,
                messageId,
                payload: saveJsonStringify(payload),
                attempts: 0,
                nextRetryAt: next,
            },
        });
    }

    async reschedule(id: number, attempts: number) {
        const delay = reportDelaySec(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.context.dbClient.job.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next },
        });
    }
}
