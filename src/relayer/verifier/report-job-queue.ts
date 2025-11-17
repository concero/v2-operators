import { ContextService } from '../services';
import { Context } from '../types';

const DELAYS = [5, 10, 30, 120, 300, 600, 1200, 3600];
const nextDelay = (attempts: number) =>
    attempts < DELAYS.length ? DELAYS[attempts] : DELAYS[DELAYS.length - 1];
const REPORT_RETRY_1M_COUNT = 4;
const reportDelaySec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300);
const saveJsonStringify = (object: Record<string, unknown>): string => {
    return JSON.stringify(object, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
};

export class ReportJobQueue extends ContextService {
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

    async markFailed(id: number, attempts: number) {
        const delay = nextDelay(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.context.dbClient.job.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next },
        });
    }

    async add(messageId: string, chainName: string, payload: any, firstDelaySec = 60) {
        const next = new Date(Date.now() + firstDelaySec * 1000);
        await this.context.dbClient.job.upsert({
            where: { messageId },
            update: {
                chainName,
                payload: saveJsonStringify(payload),
                nextRetryAt: next,
            },
            create: {
                chainName,
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

    async cancelByMessageIds(messageIds: string[]) {
        await this.context.dbClient.job.deleteMany({
            where: {
                messageId: {
                    in: messageIds,
                },
            },
        });
    }
}
