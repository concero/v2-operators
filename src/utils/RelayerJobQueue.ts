import { PrismaClient } from "@prisma/client";

export class RelayerJobQueue {
  constructor(private prisma: PrismaClient) {}

  async add(jobType: "tx-submit" | "report-request", chainName: string | null, txHash: string | null, payload: any) {
    await this.prisma.relayerJob.create({
      data: {
        jobType,
        chainName,
        txHash,
        payload: JSON.stringify(payload),
      },
    });
  }

  async getDue(limit = 5) {
    return this.prisma.relayerJob.findMany({
      where: { status: "pending", nextRetryAt: { lte: new Date() } },
      orderBy: { id: "asc" },
      take: limit,
    });
  }

  async markSuccess(id: number) {
    await this.prisma.relayerJob.delete({ where: { id } });
  }

  async markFailed(id: number, attempts: number) {
    const delaySec = Math.min(60 * Math.pow(2, attempts), 600); // максимум 10 минут
    const next = new Date(Date.now() + delaySec * 1000);
    await this.prisma.relayerJob.update({
      where: { id },
      data: { attempts: { increment: 1 }, nextRetryAt: next },
    });
  }
}
