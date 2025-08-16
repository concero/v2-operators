import { TransactionInfo } from '@concero/operator-utils';
export declare class MetricsIntegration {
    private static instance;
    private metricsCollector;
    private constructor();
    static getInstance(): MetricsIntegration;
    private setupEventListeners;
    recordTransactionFromTxInfo(txInfo: TransactionInfo, operation: string, gasUsed: bigint, gasPrice: bigint, success: boolean, error?: string, messageId?: string): Promise<void>;
    recordMessageProcessing(messageId: string, srcChain: string, dstChain: string, srcChainSelector: string, dstChainSelector: string, status: 'sent' | 'processed' | 'failed' | 'finalized', processingTimeMs?: number, error?: string): Promise<void>;
    recordSystemMetric(metricType: 'cpu' | 'memory' | 'network' | 'error' | 'balance', value: number, network?: string, metadata?: string): Promise<void>;
    initialize(): Promise<void>;
}
//# sourceMappingURL=MetricsIntegration.d.ts.map