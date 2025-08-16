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
export declare class MetricsCollector {
    private static instance;
    private prisma;
    private constructor();
    static getInstance(): MetricsCollector;
    recordTransaction(metric: Omit<TransactionMetric, 'id'>): Promise<void>;
    recordMessage(metric: Omit<MessageMetric, 'id'>): Promise<void>;
    recordSystemMetric(metric: Omit<SystemMetric, 'id'>): Promise<void>;
    getTransactionMetrics(startDate?: Date, endDate?: Date, network?: string): Promise<TransactionMetric[]>;
    getMessageMetrics(startDate?: Date, endDate?: Date, srcChain?: string): Promise<MessageMetric[]>;
    getSystemMetrics(metricType?: string, startDate?: Date, endDate?: Date): Promise<SystemMetric[]>;
    getDailySummary(date: Date): Promise<{
        totalTransactions: number;
        successfulTransactions: number;
        failedTransactions: number;
        totalGasUsed: bigint;
        totalMessages: number;
        successfulMessages: number;
        failedMessages: number;
    }>;
    cleanupOldData(daysToKeep?: number): Promise<void>;
    getHealthMetrics(): Promise<{
        totalTransactions: number;
        totalMessages: number;
        recentErrors: number;
        lastTransaction: Date | null;
        lastMessage: Date | null;
    }>;
}
//# sourceMappingURL=MetricsCollector.d.ts.map