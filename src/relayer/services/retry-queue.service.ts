import { ContextProvider } from './context.provider';

import { Context, JobStatus } from '../types';

const REPORT_RETRY_1M_COUNT = 4;
const reportDelaySec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300);
const saveJsonStringify = (object: Record<string, unknown>): string => {
    return JSON.stringify(object, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
};

export class JobQueue extends ContextProvider {
    constructor(context: Context) {
        super('JobQueue', context);
    }

    async add(messageId: string, payload: Record<string, unknown>, status: JobStatus) {
        const next = new Date(Date.now() + 60000);
        await this.context.dbClient.job.upsert({
            where: { messageId },
            update: {
                payload: saveJsonStringify(payload),
                nextRetryAt: next,
            },
            create: {
                messageId,
                payload: saveJsonStringify(payload),
                attempts: 0,
                nextRetryAt: next,
                status,
            },
        });
    }

    async getDue(limit: number, status: JobStatus) {
        return this.context.dbClient.job.findMany({
            where: { nextRetryAt: { lte: new Date() }, status },
            orderBy: { id: 'asc' },
            take: limit,
        });
    }

    async markSuccess(jobId: number) {
        await this.context.dbClient.job.update({
            where: { id: jobId },
            data: { status: JobStatus.Success },
        });
    }

    async changeStatus(jobId: number, status: JobStatus) {
        await this.context.dbClient.job.update({
            where: { id: jobId },
            data: { status },
        });
    }

    async reschedule(id: number, attempts: number, status: JobStatus) {
        const delay = reportDelaySec(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.context.dbClient.job.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next, status },
        });
    }
}
