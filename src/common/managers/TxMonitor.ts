import { LoggerInterface } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxMonitorConfig } from "../../types/ManagerConfigs";
import {
    ITxMonitor,
    IViemClientManager,
    MonitoredTransaction,
    TransactionInfo,
} from "../../types/managers";

enum TransactionStatus {
    Pending = "pending",
    Confirmed = "confirmed",
    Finalized = "finalized",
    Dropped = "dropped",
    Reorged = "reorged",
    Failed = "failed",
}

interface TransactionMonitor {
    transaction: MonitoredTransaction;
    retryCallback: (failedTx: TransactionInfo) => Promise<TransactionInfo | null>;
    finalityCallback: (finalizedTx: TransactionInfo) => void;
    retryCount: number;
    lastRetryAt?: number;
}

export class TxMonitor implements ITxMonitor {
    private static instance: TxMonitor | undefined;
    private monitors: Map<string, TransactionMonitor> = new Map();
    private viemClientManager: IViemClientManager;
    private disposed: boolean = false;
    private logger: LoggerInterface;
    private config: TxMonitorConfig;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        config: TxMonitorConfig,
    ) {
        this.viemClientManager = viemClientManager;
        this.logger = logger;
        this.config = config;
        this.startMonitoring();
        this.logger.info("initialized");
    }

    public static createInstance(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        config: TxMonitorConfig,
    ): TxMonitor {
        if (!TxMonitor.instance) {
            TxMonitor.instance = new TxMonitor(logger, viemClientManager, config);
        }
        return TxMonitor.instance;
    }

    public static getInstance(): TxMonitor {
        if (!TxMonitor.instance) {
            throw new Error("TxMonitor is not initialized. Call createInstance() first.");
        }
        return TxMonitor.instance;
    }

    private startMonitoring(): void {
        const intervalMs = this.config.checkIntervalMs || 5000;
        this.checkInterval = setInterval(() => {
            this.checkAllTransactions().catch(error => {
                this.logger.error("Error in transaction monitoring cycle:", error);
            });
        }, intervalMs);
    }

    public watchTxFinality(
        txInfo: TransactionInfo,
        retryCallback: (failedTx: TransactionInfo) => Promise<TransactionInfo | null>,
        finalityCallback: (finalizedTx: TransactionInfo) => void,
    ): void {
        if (this.monitors.has(txInfo.txHash)) {
            this.logger.debug(`Transaction ${txInfo.txHash} is already being monitored`);
            return;
        }

        const monitoredTx: MonitoredTransaction = {
            txHash: txInfo.txHash,
            chainName: txInfo.chainName,
            blockNumber: txInfo.submissionBlock,
            firstSeen: Date.now(),
            lastChecked: Date.now(),
            status: TransactionStatus.Pending,
            managedTxId: txInfo.id,
        };

        const monitor: TransactionMonitor = {
            transaction: monitoredTx,
            retryCallback,
            finalityCallback,
            retryCount: 0,
        };

        this.monitors.set(txInfo.txHash, monitor);
        this.logger.debug(`Started monitoring tx ${txInfo.txHash} on ${txInfo.chainName}`);
    }

    public addTransaction(txHash: string, txInfo: TransactionInfo): void {
        // This method is kept for backward compatibility but delegates to watchTxFinality
        this.logger.warn(`addTransaction called directly - use watchTxFinality instead`);

        // Create default callbacks for backward compatibility
        const defaultRetryCallback = async (
            failedTx: TransactionInfo,
        ): Promise<TransactionInfo | null> => {
            this.logger.warn(
                `Transaction ${failedTx.txHash} failed but no retry callback provided`,
            );
            return null;
        };

        const defaultFinalityCallback = (finalizedTx: TransactionInfo): void => {
            this.logger.info(
                `Transaction ${finalizedTx.txHash} finalized (using legacy addTransaction)`,
            );
        };

        this.watchTxFinality(txInfo, defaultRetryCallback, defaultFinalityCallback);
    }

    private async checkAllTransactions(): Promise<void> {
        if (this.disposed) return;

        const networksToCheck = new Map<string, TransactionMonitor[]>();

        // Group monitors by network
        for (const monitor of this.monitors.values()) {
            const chainName = monitor.transaction.chainName;
            if (!networksToCheck.has(chainName)) {
                networksToCheck.set(chainName, []);
            }
            networksToCheck.get(chainName)!.push(monitor);
        }

        // Check transactions for each network
        for (const [chainName, monitors] of networksToCheck) {
            const network = this.getNetwork(chainName);
            if (!network) continue;

            await this.checkNetworkTransactions(network, monitors);
        }
    }

    private async checkNetworkTransactions(
        network: ConceroNetwork,
        monitors: TransactionMonitor[],
    ): Promise<void> {
        const { publicClient } = this.viemClientManager.getClients(network);
        const currentBlock = await publicClient.getBlockNumber();
        const finalityConfirmations = BigInt(network.finalityConfirmations ?? 12);
        const finalityBlockNumber = currentBlock - finalityConfirmations;

        for (const monitor of monitors) {
            await this.checkTransaction(monitor, currentBlock, finalityBlockNumber, network);
        }
    }

    private async checkTransaction(
        monitor: TransactionMonitor,
        currentBlock: bigint,
        finalityBlockNumber: bigint,
        network: ConceroNetwork,
    ): Promise<void> {
        const tx = monitor.transaction;
        tx.lastChecked = Date.now();

        try {
            const { publicClient } = this.viemClientManager.getClients(network);
            const txInfo = await publicClient.getTransaction({
                hash: tx.txHash as `0x${string}`,
            });

            if (!txInfo) {
                await this.handleMissingTransaction(monitor, network);
                return;
            }

            // Update block number if not set
            if (!tx.blockNumber && txInfo.blockNumber) {
                tx.blockNumber = txInfo.blockNumber;
                this.logger.debug(
                    `Transaction ${tx.txHash} included in block ${txInfo.blockNumber}`,
                );
            }

            // Check if block number changed (potential reorg)
            if (tx.blockNumber && txInfo.blockNumber && tx.blockNumber !== txInfo.blockNumber) {
                this.logger.warn(
                    `Transaction ${tx.txHash} block changed from ${tx.blockNumber} to ${txInfo.blockNumber} (reorg detected)`,
                );
                tx.blockNumber = txInfo.blockNumber;
            }

            // Check if transaction has reached finality
            if (txInfo.blockNumber && txInfo.blockNumber <= finalityBlockNumber) {
                await this.handleFinalizedTransaction(monitor);
            } else if (txInfo.blockNumber) {
                const confirmations = currentBlock - txInfo.blockNumber + 1n;
                const requiredConfirmations = BigInt(network.finalityConfirmations ?? 12);
                this.logger.debug(
                    `Transaction ${tx.txHash} has ${confirmations} confirmations (needs ${requiredConfirmations})`,
                );
            }
        } catch (error) {
            this.logger.error(`Error checking transaction ${tx.txHash}:`, error);

            // If there's a persistent error, consider retrying the transaction
            const timeSinceLastRetry = tx.lastChecked - (monitor.lastRetryAt || 0);
            const retryDelayMs = this.config.retryDelayMs || 30000;

            if (timeSinceLastRetry > retryDelayMs) {
                await this.retryTransaction(monitor, network);
            }
        }
    }

    private async handleMissingTransaction(
        monitor: TransactionMonitor,
        network: ConceroNetwork,
    ): Promise<void> {
        const tx = monitor.transaction;

        // Give the transaction some time before considering it dropped
        const timeSinceSubmission = Date.now() - tx.firstSeen;
        const dropTimeoutMs = this.config.dropTimeoutMs || 60000;

        if (timeSinceSubmission < dropTimeoutMs) {
            this.logger.debug(
                `Transaction ${tx.txHash} not found yet (${timeSinceSubmission}ms since submission)`,
            );
            return;
        }

        tx.status = TransactionStatus.Dropped;
        this.logger.warn(
            `Transaction ${tx.txHash} not found on chain ${network.name} after ${timeSinceSubmission}ms`,
        );

        await this.retryTransaction(monitor, network);
    }

    private async retryTransaction(
        monitor: TransactionMonitor,
        network: ConceroNetwork,
    ): Promise<void> {
        const tx = monitor.transaction;
        monitor.retryCount++;
        monitor.lastRetryAt = Date.now();

        this.logger.info(
            `Retrying transaction ${tx.txHash} on ${network.name} (attempt ${monitor.retryCount})`,
        );

        // Create a TransactionInfo from MonitoredTransaction for the retry callback
        const failedTx: TransactionInfo = {
            id: tx.managedTxId,
            txHash: tx.txHash,
            chainName: tx.chainName,
            submittedAt: tx.firstSeen,
            submissionBlock: tx.blockNumber,
            status: "failed",
        };

        const newTxInfo = await monitor.retryCallback(failedTx);

        if (newTxInfo) {
            // Remove the old monitor
            this.monitors.delete(tx.txHash);

            // Add new monitor for the retry transaction
            this.watchTxFinality(newTxInfo, monitor.retryCallback, monitor.finalityCallback);

            this.logger.info(`Transaction ${tx.txHash} replaced with ${newTxInfo.txHash}`);
        } else {
            this.logger.error(`Failed to retry transaction ${tx.txHash} - will try again later`);
        }
    }

    private async handleFinalizedTransaction(monitor: TransactionMonitor): Promise<void> {
        const tx = monitor.transaction;
        tx.status = TransactionStatus.Finalized;

        this.logger.info(`Transaction ${tx.txHash} has reached finality on ${tx.chainName}`);

        // Create a TransactionInfo for the finality callback
        const finalizedTx: TransactionInfo = {
            id: tx.managedTxId,
            txHash: tx.txHash,
            chainName: tx.chainName,
            submittedAt: tx.firstSeen,
            submissionBlock: tx.blockNumber,
            status: "finalized",
        };

        monitor.finalityCallback(finalizedTx);

        // Remove from monitoring
        this.monitors.delete(tx.txHash);
    }

    private getNetwork(chainName: string): ConceroNetwork | undefined {
        // This would need to be implemented based on your network manager
        // For now, return undefined to skip
        return undefined;
    }

    public async checkTransactionsInRange(
        network: ConceroNetwork,
        startBlock: bigint,
        endBlock: bigint,
    ): Promise<void> {
        // This method can be used for batch checking if needed
        this.logger.debug(`Batch checking not implemented - using continuous monitoring instead`);
    }

    public getMonitoredTransactions(chainName?: string): MonitoredTransaction[] {
        const transactions: MonitoredTransaction[] = [];

        for (const monitor of this.monitors.values()) {
            if (!chainName || monitor.transaction.chainName === chainName) {
                transactions.push(monitor.transaction);
            }
        }

        return transactions;
    }

    public getTransactionsByMessageId(): Map<string, MonitoredTransaction[]> {
        // This method is no longer relevant for a generic monitor
        this.logger.warn("getTransactionsByMessageId called on generic TxMonitor");
        return new Map();
    }

    public dispose(): void {
        this.disposed = true;

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.monitors.clear();
        this.logger.info("Disposed");
    }
}
