import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxMonitor, MonitoredTransaction } from "../../types/managers/ITxMonitor";
import { ManagedTx } from "../../types/managers/ITxWriter";
import { logger } from "../utils";

import { ViemClientManager } from "./ViemClientManager";

enum TransactionStatus {
    Pending = "pending",
    Confirmed = "confirmed",
    Finalized = "finalized",
    Dropped = "dropped",
    Reorged = "reorged",
    Failed = "failed",
}

export class TxMonitor implements ITxMonitor {
    private static instance: TxMonitor | undefined;
    private transactions: Map<string, MonitoredTransaction> = new Map();
    private viemClientManager: ViemClientManager;
    private disposed: boolean = false;
    private txFinalityCallback: (txHash: string, chainName: string) => void;
    private txReorgCallback: (txHash: string, chainName: string) => Promise<string | null>;

    constructor(
        viemClientManager: ViemClientManager,
        txFinalityCallback: (txHash: string, chainName: string) => void,
        txReorgCallback: (txHash: string, chainName: string) => Promise<string | null>,
    ) {
        this.viemClientManager = viemClientManager;
        this.txFinalityCallback = txFinalityCallback;
        this.txReorgCallback = txReorgCallback;
        logger.info("[TxMonitor]: initialized successfully");
    }

    public static createInstance(
        viemClientManager: ViemClientManager,
        txFinalityCallback: (txHash: string, chainName: string) => void,
        txReorgCallback: (txHash: string, chainName: string) => Promise<string | null>,
    ): TxMonitor {
        TxMonitor.instance = new TxMonitor(viemClientManager, txFinalityCallback, txReorgCallback);
        return TxMonitor.instance;
    }

    public static getInstance(): TxMonitor {
        if (!TxMonitor.instance) {
            throw new Error("TxMonitor is not initialized. Call createInstance() first.");
        }
        return TxMonitor.instance;
    }

    public addTransaction(txHash: string, managedTx: ManagedTx): void {
        if (this.transactions.has(txHash)) {
            logger.debug(`[TxMonitor]: Transaction ${txHash} is already being monitored`);
            return;
        }

        if (managedTx.txHash !== txHash) {
            logger.error(`[TxMonitor]: Transaction hash mismatch: ${txHash} vs ${managedTx.txHash}`);
            return;
        }

        const monitoredTx: MonitoredTransaction = {
            txHash,
            chainName: managedTx.chainName,
            messageId: managedTx.messageId,
            blockNumber: managedTx.submissionBlock,
            firstSeen: Date.now(),
            lastChecked: Date.now(),
            status: TransactionStatus.Pending,
            managedTxId: managedTx.id,
        };

        this.transactions.set(txHash, monitoredTx);
        logger.info(
            `[TxMonitor]: Started monitoring transaction ${txHash} on ${managedTx.chainName}` +
                (managedTx.messageId ? ` for message ${managedTx.messageId}` : ""),
        );
    }

    public async checkTransactionsInRange(
        network: ConceroNetwork,
        startBlock: bigint,
        endBlock: bigint,
    ): Promise<void> {
        if (this.disposed) return;

        const finalityConfirmations = network.finalityConfirmations ?? 12;
        const finalityBlockNumber = endBlock - BigInt(finalityConfirmations);

        // Only process transactions that:
        // 1. Belong to this network
        // 2. Are pending
        // 3. Have a block number
        // 4. Their block number + finality confirmations <= endBlock (potentially ready for finality)
        const txsToCheck = Array.from(this.transactions.values()).filter(
            tx =>
                tx.chainName === network.name &&
                tx.status === TransactionStatus.Pending &&
                tx.blockNumber !== null &&
                tx.blockNumber <= finalityBlockNumber,
        );

        if (txsToCheck.length === 0) return;

        logger.debug(
            `[TxMonitor] Checking ${txsToCheck.length} transactions for finality on ${network.name} at block ${endBlock}`,
        );

        for (const tx of txsToCheck) {
            await this.checkTransaction(tx, finalityBlockNumber, network);
        }
    }

    private async checkTransaction(
        tx: MonitoredTransaction,
        finalityBlockNumber: bigint,
        network: ConceroNetwork,
    ): Promise<void> {
        if (!tx.blockNumber) return;

        // Skip if the transaction's block hasn't reached finality yet
        if (tx.blockNumber > finalityBlockNumber) {
            return;
        }

        try {
            const { publicClient } = this.viemClientManager.getClients(network);

            const txInfo = await publicClient.getTransaction({ hash: tx.txHash as `0x${string}` });

            if (!txInfo) {
                await this.handleMissingTransaction(tx, network);
                return;
            }

            if (txInfo.blockNumber && tx.blockNumber !== txInfo.blockNumber) {
                logger.info(
                    `[TxMonitor]: Transaction ${tx.txHash} block number changed from ${tx.blockNumber} to ${txInfo.blockNumber} (potential reorg)`,
                );
                tx.blockNumber = txInfo.blockNumber;

                // If the new block number hasn't reached finality yet, keep monitoring
                if (txInfo.blockNumber > finalityBlockNumber) {
                    tx.lastChecked = Date.now();
                    return;
                }
            }

            // At this point we know the transaction is confirmed with sufficient confirmations
            tx.status = TransactionStatus.Finalized;

            this.txFinalityCallback(tx.txHash, tx.chainName);

            if (tx.messageId) {
                await this.finalizeMessageTransactions(tx.messageId);
            }

            this.transactions.delete(tx.txHash);

            logger.info(
                `[TxMonitor]: Transaction ${tx.txHash} has reached finality on ${network.name}`,
            );

            tx.lastChecked = Date.now();
        } catch (error) {
            logger.error(`[TxMonitor]: Error checking transaction ${tx.txHash}:`, error);
        }
    }

    private async handleMissingTransaction(
        tx: MonitoredTransaction,
        network: ConceroNetwork,
    ): Promise<void> {
        tx.status = TransactionStatus.Reorged;
        logger.info(
            `[TxMonitor]: Transaction ${tx.txHash} not found on chain ${network.name}, potential reorg`,
        );

        const newTxHash = await this.txReorgCallback(tx.txHash, tx.chainName);

        if (newTxHash) {
            this.transactions.delete(tx.txHash);
            logger.info(`[TxMonitor]: Transaction ${tx.txHash} replaced with ${newTxHash}`);
        } else {
            tx.status = TransactionStatus.Dropped;
            logger.warn(`[TxMonitor]: Failed to resubmit transaction ${tx.txHash} after reorg`);
        }
    }

    private async finalizeMessageTransactions(messageId: string): Promise<void> {
        const relatedTxs = Array.from(this.transactions.values()).filter(
            tx => tx.messageId === messageId,
        );

        for (const tx of relatedTxs) {
            if (tx.status === TransactionStatus.Pending) {
                logger.info(
                    `[TxMonitor]: Finalizing related transaction ${tx.txHash} for message ${messageId}`,
                );

                tx.status = TransactionStatus.Finalized;
                this.txFinalityCallback(tx.txHash, tx.chainName);
                this.transactions.delete(tx.txHash);
            }
        }
    }

    public getMonitoredTransactions(chainName?: string): MonitoredTransaction[] {
        if (chainName) {
            return Array.from(this.transactions.values()).filter(tx => tx.chainName === chainName);
        }

        return Array.from(this.transactions.values());
    }

    public getTransactionsByMessageId(): Map<string, MonitoredTransaction[]> {
        const result = new Map<string, MonitoredTransaction[]>();

        for (const tx of this.transactions.values()) {
            if (!tx.messageId) continue;

            const existing = result.get(tx.messageId) || [];
            existing.push(tx);
            result.set(tx.messageId, existing);
        }

        return result;
    }

    public dispose(): void {
        this.disposed = true;
        this.transactions.clear();
        logger.info("[TxMonitor]: Disposed");
    }
}
