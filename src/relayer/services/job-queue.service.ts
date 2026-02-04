import { LoggerInterface } from '@concero/operator-utils';
import { Job, Prisma, PrismaClient } from '@prisma/client';

import { JobPayload, JobStatus } from '../../types';
import { Nullable } from '../../types/common';
import { ObjectLib } from '../../utils';

type CreateEntity = Omit<
    Job,
    | 'id'
    | 'status'
    | 'payload'
    | 'errorCode'
    | 'verificationAttempts'
    | 'verificationPlannedTo'
    | 'lastVerificationAt'
    | 'submitAttempts'
    | 'submitPlannedTo'
    | 'lastSubmitAt'
    | 'createdAt'
    | 'updatedAt'
> & { status: JobStatus; payload: JobPayload };

export class JobQueueService {
    private readonly logger: LoggerInterface;
    private readonly dbClient: PrismaClient;

    constructor(logger: LoggerInterface, dbClient: PrismaClient) {
        this.logger = logger;
        this.dbClient = dbClient;
    }

    async create(entity: CreateEntity) {
        return this.dbClient.job.create({
            data: {
                messageId: entity.messageId,
                status: entity.status,
                validatorType: entity.validatorType,
                payload: ObjectLib.stringify(entity.payload),
                // src
                srcTxHash: entity.srcTxHash,
                srcBlockNumber: entity.srcBlockNumber,
                srcChainSelector: entity.srcChainSelector,
                // dst
                dstTxHash: null,
                dstBlockNumber: null,
                dstChainSelector: entity.dstChainSelector,
            },
        });
    }

    async findOne(where: Prisma.JobWhereUniqueInput): Promise<Nullable<Job>> {
        try {
            return this.dbClient.job.findUnique({
                where,
            });
        } catch (e) {
            this.logger.error(`[getList] failed ${e}`);
            return null;
        }
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
}
