import { PrismaClient } from '@prisma/client';

export interface TransactionMetric {
  id?: string;
  txHash: string;
  network: string;
  operation: string;
  gasUsed: bigint;
  gasPrice: bigint;
  success: boolean;
  error?: string;
  timestamp: Date;
  messageId?: string;
  chainSelector?: string;
}

export interface MessageMetric {
  id?: string;
  messageId: string;
  srcChain: string;
  dstChain: string;
  srcChainSelector: string;
  dstChainSelector: string;
  status: 'sent' | 'processed' | 'failed' | 'finalized';
  timestamp: Date;
  processingTimeMs?: number;
  error?: string;
}

export interface SystemMetric {
  id?: string;
  metricType: 'cpu' | 'memory' | 'network' | 'error' | 'balance';
  network?: string;
  value: number;
  metadata?: string;
  timestamp: Date;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  async recordTransaction(metric: Omit<TransactionMetric, 'id'>): Promise<void> {
    await this.prisma.transactionMetric.create({
      data: {
        txHash: metric.txHash,
        network: metric.network,
        operation: metric.operation,
        gasUsed: metric.gasUsed.toString(),
        gasPrice: metric.gasPrice.toString(),
        success: metric.success,
        error: metric.error,
        timestamp: metric.timestamp,
        messageId: metric.messageId,
        chainSelector: metric.chainSelector,
      },
    });
  }

  async recordMessage(metric: Omit<MessageMetric, 'id'>): Promise<void> {
    await this.prisma.messageMetric.create({
      data: {
        messageId: metric.messageId,
        srcChain: metric.srcChain,
        dstChain: metric.dstChain,
        srcChainSelector: metric.srcChainSelector,
        dstChainSelector: metric.dstChainSelector,
        status: metric.status,
        timestamp: metric.timestamp,
        processingTimeMs: metric.processingTimeMs,
        error: metric.error,
      },
    });
  }

  async recordSystemMetric(metric: Omit<SystemMetric, 'id'>): Promise<void> {
    await this.prisma.systemMetric.create({
      data: {
        metricType: metric.metricType,
        network: metric.network,
        value: metric.value,
        metadata: metric.metadata,
        timestamp: metric.timestamp,
      },
    });
  }

  async getTransactionMetrics(
    startDate?: Date,
    endDate?: Date,
    network?: string
  ): Promise<TransactionMetric[]> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    if (network) where.network = network;

    const results = await this.prisma.transactionMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return results.map(r => ({
      ...r,
      gasUsed: BigInt(r.gasUsed),
      gasPrice: BigInt(r.gasPrice),
    }));
  }

  async getMessageMetrics(
    startDate?: Date,
    endDate?: Date,
    srcChain?: string
  ): Promise<MessageMetric[]> {
    const where: any = {};
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }
    if (srcChain) where.srcChain = srcChain;

    const results = await this.prisma.messageMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return results;
  }

  async getSystemMetrics(
    metricType?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<SystemMetric[]> {
    const where: any = {};
    
    if (metricType) where.metricType = metricType;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    const results = await this.prisma.systemMetric.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return results;
  }

  async getDailySummary(date: Date): Promise<{
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    totalGasUsed: bigint;
    totalMessages: number;
    successfulMessages: number;
    failedMessages: number;
  }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const [transactionStats, messageStats] = await Promise.all([
      this.prisma.transactionMetric.aggregate({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _sum: { 
          success: true,
          gasUsed: true,
        },
      }),
      this.prisma.messageMetric.aggregate({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        _count: { id: true },
        _sum: {
          status: true,
        },
      }),
    ]);

    const successfulMessages = await this.prisma.messageMetric.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['processed', 'finalized'] },
      },
    });

    const failedMessages = await this.prisma.messageMetric.count({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        status: 'failed',
      },
    });

    return {
      totalTransactions: transactionStats._count.id || 0,
      successfulTransactions: transactionStats._sum.success || 0,
      failedTransactions: (transactionStats._count.id || 0) - (transactionStats._sum.success || 0),
      totalGasUsed: BigInt(transactionStats._sum.gasUsed?.toString() || '0'),
      totalMessages: messageStats._count.id || 0,
      successfulMessages,
      failedMessages,
    };
  }

  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await Promise.all([
      this.prisma.transactionMetric.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.messageMetric.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
      this.prisma.systemMetric.deleteMany({
        where: { timestamp: { lt: cutoffDate } },
      }),
    ]);
  }

  async getHealthMetrics(): Promise<{
    totalTransactions: number;
    totalMessages: number;
    recentErrors: number;
    lastTransaction: Date | null;
    lastMessage: Date | null;
  }> {
    const [transactionCount, messageCount, recentErrors, lastTransaction, lastMessage] =
      await Promise.all([
        this.prisma.transactionMetric.count(),
        this.prisma.messageMetric.count(),
        this.prisma.systemMetric.count({
          where: {
            metricType: 'error',
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
        this.prisma.transactionMetric.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        }),
        this.prisma.messageMetric.findFirst({
          orderBy: { timestamp: 'desc' },
          select: { timestamp: true },
        }),
      ]);

    return {
      totalTransactions: transactionCount,
      totalMessages: messageCount,
      recentErrors,
      lastTransaction: lastTransaction?.timestamp || null,
      lastMessage: lastMessage?.timestamp || null,
    };
  }
}