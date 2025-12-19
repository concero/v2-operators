import { LoggerInterface } from '@concero/operator-utils';
import { Job, Prisma, PrismaClient } from '@prisma/client';

import { Nullable } from '../../types/common';
import { ObjectLib } from '../../utils';
import { JobPayload, JobStatus } from '../types';

const REPORT_RETRY_1M_COUNT = 4;
const reportDelayMlSec = (attempts: number) => (attempts < REPORT_RETRY_1M_COUNT ? 60 : 300) * 1000;

type CreateEntity = Omit<
    Job,
    'id' | 'status' | 'payload' | 'attempts' | 'nextRetryAt' | 'createdAt' | 'updatedAt'
> & { status: JobStatus; payload: JobPayload };

export class JobQueueService {
    private readonly logger: LoggerInterface;
    private readonly dbClient: PrismaClient;

    constructor(logger: LoggerInterface, dbClient: PrismaClient) {
        this.logger = logger;
        this.dbClient = dbClient;
    }

    async create(entity: CreateEntity) {
        const nextRetryAt = new Date(Date.now() + 60_000);

        const rawPayload = ObjectLib.stringify(entity.payload);
        return this.dbClient.job.create({
            data: {
                messageId: entity.messageId,
                status: entity.status,
                payload: rawPayload,
                srcChainSelector: entity.srcChainSelector,
                srcBlockNumberDelta: entity.srcBlockNumberDelta,
                dstChainSelector: entity.dstChainSelector,
                dstBlockNumberDelta: entity.dstBlockNumberDelta,
                attempts: 0,
                nextRetryAt,
            },
        });
    }

    async getList(
        where?: Prisma.JobWhereInput,
        pagination?: { take?: number; skip?: number },
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

    async findOne(where: Prisma.JobWhereInput): Promise<Nullable<Job>> {
        return this.dbClient.job.findFirst({
            where,
        });
    }

    async updateOne(where: Prisma.JobWhereUniqueInput, data: Prisma.JobUpdateInput) {
        return this.dbClient.job.update({
            where,
            data,
        });
    }

    async updateMany(where: Prisma.JobWhereInput, data: Prisma.JobUpdateInput) {
        return this.dbClient.job.updateMany({
            where,
            data,
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
