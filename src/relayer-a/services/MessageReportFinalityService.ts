import { Logger, NetworkManager, TxMonitor } from '@concero/operator-utils';
import { TransactionInfo } from '@concero/operator-utils';
import { v4 as uuidv4 } from 'uuid';

import { ConceroNetwork } from '../../types/ConceroNetwork';
import { DecodedLog } from '../../types/DecodedLog';
import { processMessageReportRequest } from '../businessLogic/requestCLFMessageReport';

interface PendingMessageReport {
    decodedLog: DecodedLog;
    network: ConceroNetwork;
    verifierNetwork: ConceroNetwork;
    verifierAddress: string;
    chainSelector: string;
    status: 'pending' | 'finalized' | 'failed';
    createdAt: number;
}

export class MessageReportFinalityService {
    private static instance: MessageReportFinalityService;
    private pendingTransactions: Map<string, PendingMessageReport> = new Map();
    private logger: ReturnType<typeof Logger.prototype.getLogger>;
    private txMonitor: TxMonitor;
    private networkManager: NetworkManager;

    private constructor() {
        this.logger = Logger.getInstance().getLogger('MessageReportFinalityService');
        this.txMonitor = TxMonitor.getInstance();
        this.networkManager = NetworkManager.getInstance();
    }

    public static getInstance(): MessageReportFinalityService {
        if (!MessageReportFinalityService.instance) {
            MessageReportFinalityService.instance = new MessageReportFinalityService();
        }
        return MessageReportFinalityService.instance;
    }

    public addTransaction(
        decodedLog: DecodedLog,
        network: ConceroNetwork,
        verifierNetwork: ConceroNetwork,
        verifierAddress: string,
    ): void {
        const txHash = decodedLog.transactionHash!;

        this.logger.debug(`Adding transaction ${txHash} for finality tracking`);

        // Save transaction data
        const pendingReport: PendingMessageReport = {
            decodedLog,
            network,
            verifierNetwork,
            verifierAddress,
            chainSelector: network.chainSelector,
            status: 'pending',
            createdAt: Date.now(),
        };

        this.pendingTransactions.set(txHash, pendingReport);

        // Start finality tracking
        this.startWatchingFinality(txHash, Number(decodedLog.blockNumber!));
    }

    private startWatchingFinality(txHash: string, blockNumber: number): void {
        const pendingReport = this.pendingTransactions.get(txHash);
        if (!pendingReport) {
            this.logger.error(`No pending report found for tx ${txHash}`);
            return;
        }

        const txInfo: TransactionInfo = {
            id: uuidv4(),
            txHash: txHash,
            chainName: pendingReport.network.name,
            submittedAt: Date.now(),
            submissionBlock: BigInt(blockNumber),
            status: 'pending',
        };

        this.logger.debug(
            `Starting finality watch for tx ${txHash} on ${pendingReport.network.name}`,
        );

        this.txMonitor.watchTxFinality(
            txInfo,
            async failedTx => {
                this.onTransactionFailed(failedTx.txHash);
                return null;
            },
            finalizedTx => {
                this.onTransactionFinalized(finalizedTx.txHash);
            },
        );
    }

    private onTransactionFinalized(txHash: string): void {
        const pendingReport = this.pendingTransactions.get(txHash);
        if (!pendingReport) {
            this.logger.warn(`No pending report found for finalized tx ${txHash}`);
            return;
        }

        this.logger.debug(`Transaction ${txHash} finalized, processing message report request`);

        // Update status
        pendingReport.status = 'finalized';

        // Execute processMessageReportRequest asynchronously
        this.executeMessageReportRequest(pendingReport)
            .then(() => {
                this.logger.info(`Successfully processed message report for tx ${txHash}`);
                // Remove from pending after successful processing
                this.pendingTransactions.delete(txHash);
            })
            .catch(error => {
                this.logger.error(`Failed to process message report for tx ${txHash}:`, error);
                // Can keep in pending for retry or mark as failed
                pendingReport.status = 'failed';
            });
    }

    private onTransactionFailed(txHash: string): void {
        const pendingReport = this.pendingTransactions.get(txHash);
        if (!pendingReport) {
            this.logger.warn(`No pending report found for failed tx ${txHash}`);
            return;
        }

        this.logger.error(
            `Transaction ${txHash} failed to reach finality on ${pendingReport.network.name}`,
        );

        // Update status
        pendingReport.status = 'failed';
    }

    private async executeMessageReportRequest(pendingReport: PendingMessageReport): Promise<void> {
        await processMessageReportRequest(
            pendingReport.decodedLog,
            pendingReport.chainSelector,
            this.logger,
            this.networkManager,
            pendingReport.verifierNetwork,
            pendingReport.verifierAddress,
        );
    }

    // Methods for monitoring state
    public getPendingTransactions(): Map<string, PendingMessageReport> {
        return new Map(this.pendingTransactions);
    }

    public getTransactionStatus(txHash: string): string | undefined {
        return this.pendingTransactions.get(txHash)?.status;
    }

    public getPendingCount(): number {
        return Array.from(this.pendingTransactions.values()).filter(
            report => report.status === 'pending',
        ).length;
    }

    public getFailedCount(): number {
        return Array.from(this.pendingTransactions.values()).filter(
            report => report.status === 'failed',
        ).length;
    }
}
