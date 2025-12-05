import { LoggerInterface } from '@concero/operator-utils';
import { PrismaClient } from '@prisma/client';

import { JobStatus } from '../types';

const REPORT_RETRY_1M_COUNT = 4;
const reportDelaySec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300);
const saveJsonStringify = (object: Record<string, unknown>): string => {
    return JSON.stringify(object, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
};

export class JobQueueService {
    private readonly logger: LoggerInterface;
    private readonly dbClient: PrismaClient;

    constructor(logger: LoggerInterface, dbClient: PrismaClient) {
        this.logger = logger;
        this.dbClient = dbClient;
    }

    async add(messageId: string, payload: Record<string, unknown>, status: JobStatus) {
        const next = new Date(Date.now() + 60000);
        return this.dbClient.job.upsert({
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

    async findOne(messageId: string) {
        return this.dbClient.job.findUnique({
            where: { messageId },
        });
    }

    async update(messageId: string, payload: Record<string, unknown>, status?: JobStatus) {
        return this.dbClient.job.update({
            where: { messageId },
            data: {
                payload: saveJsonStringify(payload),
                status,
            },
        });
    }

    async getDue(limit: number, status: JobStatus) {
        return this.dbClient.job.findMany({
            where: { nextRetryAt: { lte: new Date() }, status },
            orderBy: { id: 'asc' },
            take: limit,
        });
    }

    async getAll(limit?: number) {
        return this.dbClient.job.findMany({
            orderBy: { id: 'asc' },
            take: limit,
        });
    }

    async markSuccess(jobId: number) {
        await this.dbClient.job.update({
            where: { id: jobId },
            data: { status: JobStatus.Success },
        });
    }

    async changeStatus(jobId: number, status: JobStatus) {
        await this.dbClient.job.update({
            where: { id: jobId },
            data: { status },
        });
    }

    async reschedule(id: number, attempts: number, status: JobStatus) {
        const delay = reportDelaySec(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.dbClient.job.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next, status },
        });
    }
}
