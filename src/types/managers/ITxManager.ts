export interface ITxManager {
    initialize(): Promise<void>;
    onTxReorg(txHash: string, chainName: string): Promise<string | null>;
    onTxFinality(txHash: string, chainName: string): void;
    createLogWatcher(
        contractAddress: string,
        chainName: string,
        onLogs: (logs: any[], network: any) => Promise<void>,
        event?: any,
    ): string;
    removeLogWatcher(watcherId: string): boolean;
    callContract(params: any): Promise<any>;
    getLogs(query: any, network: any): Promise<any[]>;
    getClients(network: any): any;
    getPendingTransactions(chainName?: string): any[];
    getTransactionsByMessageId(messageId: string): any[];
    getLatestBlockForChain(network: any): Promise<bigint | null>;
    dispose(): void;
}
