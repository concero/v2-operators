import { ConceroNetwork } from "../ConceroNetwork";

export interface TransactionInfo {
    id: string;
    txHash: string;
    chainName: string;
    submittedAt: number;
    submissionBlock: bigint | null;
    status: string;
    metadata?: {
        functionName?: string;
        contractAddress?: string;
        [key: string]: any;
    };
}

export interface MonitoredTransaction {
    txHash: string;
    chainName: string;
    blockNumber: bigint | null;
    firstSeen: number;
    lastChecked: number;
    status: string;
    managedTxId: string;
}

export interface ITxMonitor {
    watchTxFinality(
        txInfo: TransactionInfo,
        retryCallback: (failedTx: TransactionInfo) => Promise<TransactionInfo | null>,
        finalityCallback: (finalizedTx: TransactionInfo) => void,
    ): void;
    checkTransactionsInRange(
        network: ConceroNetwork,
        startBlock: bigint,
        endBlock: bigint,
    ): Promise<void>;
    getMonitoredTransactions(chainName?: string): MonitoredTransaction[];
    dispose(): void;
}
