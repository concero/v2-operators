import { AbiEvent, Address } from "viem";

import { LogResult } from "../../common/managers/TxManager";

import { ConceroNetwork } from "../ConceroNetwork";

export interface ITxManager {
    initialize(): Promise<void>;
    onTxReorg(txHash: string, chainName: string): Promise<string | null>;
    onTxFinality(txHash: string, chainName: string): void;
    logWatcher: {
        create(
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>,
            event?: AbiEvent,
        ): string;
        remove(watcherId: string): boolean;
    };
    callContract(params: any): Promise<any>;
    getLogs(query: any, network: any): Promise<any[]>;
    getClients(network: any): any;
    getPendingTransactions(chainName?: string): any[];
    getTransactionsByMessageId(messageId: string): any[];
    dispose(): void;
}
