import {
    AbiEvent,
    Address,
    Log,
    PublicClient,
    SimulateContractParameters,
    WalletClient,
} from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

import { LogQuery } from "./ITxReader";
import { ManagedTx } from "./ITxWriter";

export interface ITxManager {
    initialize(): Promise<void>;

    // Contract interaction methods
    callContract(
        walletClient: WalletClient,
        publicClient: PublicClient,
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<ManagedTx>;

    // Transaction monitoring methods
    onTxReorg(txHash: string, chainName: string): Promise<string | null>;
    onTxFinality(txHash: string, chainName: string): void;

    // Log reading methods
    getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]>;
    logWatcher: {
        create(
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event?: AbiEvent,
        ): string;
        remove(watcherId: string): boolean;
    };

    // Transaction status methods
    getPendingTransactions(chainName?: string): ManagedTx[];
    getTransactionsByMessageId(messageId: string): ManagedTx[];

    dispose(): void;
}
