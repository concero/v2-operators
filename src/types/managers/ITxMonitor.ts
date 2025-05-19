export interface ITxMonitor {
    addTransaction(txHash: string, managedTx: any): void;
    checkTransactionsInRange(network: any, startBlock: bigint, endBlock: bigint): Promise<void>;
    getMonitoredTransactions(chainName?: string): any[];
    getTransactionsByMessageId(): Map<string, any[]>;
    dispose(): void;
}
