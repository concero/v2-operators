import { ConceroNetwork } from "../ConceroNetwork";
import { ManagedTx } from "./ITxWriter";

export interface MonitoredTransaction {
    txHash: string;
    chainName: string;
    messageId?: string;
    blockNumber: bigint | null;
    firstSeen: number;
    lastChecked: number;
    status: string;
    managedTxId: string;
}

export interface ITxMonitor {
    addTransaction(txHash: string, managedTx: ManagedTx): void;
    checkTransactionsInRange(network: ConceroNetwork, startBlock: bigint, endBlock: bigint): Promise<void>;
    getMonitoredTransactions(chainName?: string): MonitoredTransaction[];
    getTransactionsByMessageId(): Map<string, MonitoredTransaction[]>;
    dispose(): void;
}
