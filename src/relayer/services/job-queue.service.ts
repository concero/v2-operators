import { LoggerInterface } from '@concero/operator-utils';
import { Job, Prisma, PrismaClient } from '@prisma/client';
import stringify from 'json-stable-stringify';

import { Nullable } from '../../types/common';
import { JobStatus } from '../types';

const REPORT_RETRY_1M_COUNT = 4;
const reportDelayMlSec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300) * 1000;

export class JobQueueService {
    private readonly logger: LoggerInterface;
    private readonly dbClient: PrismaClient;

    constructor(logger: LoggerInterface, dbClient: PrismaClient) {
        this.logger = logger;
        this.dbClient = dbClient;
    }

    async create(
        messageId: string,
        srcChainSelector: number,
        payload: Record<string, unknown>,
        status: JobStatus,
    ) {
        const nextRetryAt = new Date(Date.now() + 60_000);
        return this.dbClient.job.upsert({
            where: { messageId },
            update: {
                payload: stringify(payload || '{}') as string,
                srcChainSelector,
                nextRetryAt,
            },
            create: {
                messageId,
                payload: stringify(payload || '{}') as string,
                srcChainSelector,
                attempts: 0,
                nextRetryAt,
                status,
            },
        });
    }

    async findOne(where: Prisma.JobWhereInput): Promise<Nullable<Job>> {
        return this.dbClient.job.findFirst({
            where,
        });
    }

    async getList(
        where?: Prisma.JobWhereInput,
        pagination?: { take: number; skip: number },
    ): Promise<Job[]> {
        try {
            return this.dbClient.job.findMany({
                where,
                take: pagination?.take,
                skip: pagination?.skip,
            });
        } catch (e) {
            this.logger.error(`[getList] failed ${e}`);
            return [];
        }
    }

    async update(messageId: string, payload: Record<string, unknown>, status?: JobStatus) {
        return this.dbClient.job.update({
            where: { messageId },
            data: {
                payload: stringify(payload || '{}') as string,
                status,
            },
        });
    }

    async updateMany(where: Prisma.JobWhereInput, data: Prisma.JobUpdateInput) {
        return this.dbClient.job.updateMany({
            where,
            data,
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
        const delay = reportDelayMlSec(attempts);
        const nextRetryAt = new Date(Date.now() + delay);
        await this.dbClient.job.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt, status },
        });
    }
}
