import { PrismaClient } from '@prisma/client';

const DELAYS = [5, 10, 30, 120, 300, 600, 1200, 3600];
const nextDelay = (attempts: number) =>
    attempts < DELAYS.length ? DELAYS[attempts] : DELAYS[DELAYS.length - 1];

export class RelayerJobQueue {
    constructor(private prisma: PrismaClient) {}

    async getDue(limit = 10) {
        return this.prisma.relayerJob.findMany({
            where: { status: 'pending', nextRetryAt: { lte: new Date() } },
            orderBy: { id: 'asc' },
            take: limit,
        });
    }

    async markSuccess(id: number) {
        await this.prisma.relayerJob.delete({ where: { id } });
    }

    async markFailed(id: number, attempts: number) {
        const delay = nextDelay(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.prisma.relayerJob.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next },
        });
    }

    async add(jobType: 'tx-submit', chainName: string, txHash: string, payload: any) {
        await this.prisma.relayerJob.create({
            data: {
                jobType,
                chainName,
                txHash,
                payload: JSON.stringify(payload, (_, v) => typeof v === 'bigint' ? v.toString() : v),
            },
        });
    }

    async upsertReportRequest(
        messageId: string,
        chainName: string,
        payload: any,
        initialDelaySec = 5,
    ) {
        const next = new Date(Date.now() + initialDelaySec * 1000);
        await this.prisma.relayerJob.upsert({
            where: { jobType_txHash: { jobType: 'report-request', txHash: messageId } },
            update: {
                chainName,
                payload: JSON.stringify(payload, (_, v) => typeof v === 'bigint' ? v.toString() : v),
                status: 'pending',
                nextRetryAt: next,
            },
            create: {
                jobType: 'report-request',
                chainName,
                txHash: messageId,
                payload: JSON.stringify(payload, (_, v) => typeof v === 'bigint' ? v.toString() : v),
                status: 'pending',
                attempts: 0,
                nextRetryAt: next,
            },
        });
    }

    async rescheduleReportRequest(id: number, attempts: number) {
        const delay = nextDelay(attempts);
        const next = new Date(Date.now() + delay * 1000);
        await this.prisma.relayerJob.update({
            where: { id },
            data: { attempts: { increment: 1 }, nextRetryAt: next },
        });
    }

    async cancelReportRequest(messageId: string) {
        await this.prisma.relayerJob.deleteMany({
            where: { jobType: 'report-request', txHash: messageId },
        });
    }
}
