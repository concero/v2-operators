import { MetricsCollector } from './MetricsCollector';

import { TransactionInfo } from '@concero/operator-utils';

import { eventEmitter } from '../constants';

export class MetricsIntegration {
    private static instance: MetricsIntegration;
    private metricsCollector: MetricsCollector;

    private constructor() {
        this.metricsCollector = MetricsCollector.getInstance();
        this.setupEventListeners();
    }

    public static getInstance(): MetricsIntegration {
        if (!MetricsIntegration.instance) {
            MetricsIntegration.instance = new MetricsIntegration();
        }
        return MetricsIntegration.instance;
    }

    private setupEventListeners() {
        // Transaction events
        eventEmitter.on('requestMessageReport', async (data: { txHash: string }) => {
            await this.metricsCollector.recordTransaction({
                txHash: data.txHash,
                network: 'verifier',
                operation: 'requestMessageReport',
                gasUsed: 0n,
                gasPrice: 0n,
                success: true,
                timestamp: new Date(),
            });
        });

        eventEmitter.on(
            'requestMessageReportError',
            async (data: { messageId: string; error: string; chainName: string }) => {
                await this.metricsCollector.recordTransaction({
                    txHash: `error-${Date.now()}`,
                    network: data.chainName,
                    operation: 'requestMessageReport',
                    gasUsed: 0n,
                    gasPrice: 0n,
                    success: false,
                    error: data.error,
                    messageId: data.messageId,
                    timestamp: new Date(),
                });
            },
        );

        eventEmitter.on(
            'submitMessageReportFinalized',
            async (data: { txHash: string; chainName: string; messageIds: string[] }) => {
                await this.metricsCollector.recordTransaction({
                    txHash: data.txHash,
                    network: data.chainName,
                    operation: 'submitMessageReport',
                    gasUsed: 0n,
                    gasPrice: 0n,
                    success: true,
                    timestamp: new Date(),
                });

                // Update message metrics for each message ID
                for (const messageId of data.messageIds) {
                    await this.metricsCollector.recordMessage({
                        messageId,
                        srcChain: data.chainName,
                        dstChain: data.chainName,
                        srcChainSelector: '',
                        dstChainSelector: '',
                        status: 'finalized',
                        timestamp: new Date(),
                    });
                }
            },
        );

        eventEmitter.on(
            'submitMessageReportFailed',
            async (data: {
                txHash: string;
                chainName: string;
                messageIds: string[];
                error: string;
            }) => {
                await this.metricsCollector.recordTransaction({
                    txHash: data.txHash,
                    network: data.chainName,
                    operation: 'submitMessageReport',
                    gasUsed: 0n,
                    gasPrice: 0n,
                    success: false,
                    error: data.error,
                    timestamp: new Date(),
                });

                // Update message metrics for each message ID
                for (const messageId of data.messageIds) {
                    await this.metricsCollector.recordMessage({
                        messageId,
                        srcChain: data.chainName,
                        dstChain: data.chainName,
                        srcChainSelector: '',
                        dstChainSelector: '',
                        status: 'failed',
                        error: data.error,
                        timestamp: new Date(),
                    });
                }
            },
        );
    }

    public async recordTransactionFromTxInfo(
        txInfo: TransactionInfo,
        operation: string,
        gasUsed: bigint,
        gasPrice: bigint,
        success: boolean,
        error?: string,
        messageId?: string,
    ): Promise<void> {
        await this.metricsCollector.recordTransaction({
            txHash: txInfo.txHash,
            network: txInfo.chainName,
            operation,
            gasUsed,
            gasPrice,
            success,
            error,
            messageId,
            timestamp: new Date(txInfo.submittedAt),
        });
    }

    public async recordMessageProcessing(
        messageId: string,
        srcChain: string,
        dstChain: string,
        srcChainSelector: string,
        dstChainSelector: string,
        status: 'sent' | 'processed' | 'failed' | 'finalized',
        processingTimeMs?: number,
        error?: string,
    ): Promise<void> {
        await this.metricsCollector.recordMessage({
            messageId,
            srcChain,
            dstChain,
            srcChainSelector,
            dstChainSelector,
            status,
            processingTimeMs,
            error,
            timestamp: new Date(),
        });
    }

    public async recordSystemMetric(
        metricType: 'cpu' | 'memory' | 'network' | 'error' | 'balance',
        value: number,
        network?: string,
        metadata?: string,
    ): Promise<void> {
        await this.metricsCollector.recordSystemMetric({
            metricType,
            value,
            network,
            metadata,
            timestamp: new Date(),
        });
    }

    public async initialize(): Promise<void> {
        // Initialize metrics collection
        await this.recordSystemMetric('cpu', 0, undefined, 'Metrics system initialized');
    }
}
