import { Abi, AbiEvent, Address, Log, SimulateContractParameters } from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

import { LogQuery } from "./ITxReader";

export interface ITxManager {
    initialize(): Promise<void>;

    // Contract interaction methods
    callContract(network: ConceroNetwork, params: SimulateContractParameters): Promise<string>;

    // Log reading methods
    getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]>;
    logWatcher: {
        create(
            contractAddress: Address,
            network: ConceroNetwork,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
            blockManager: any,
        ): string;
        remove(watcherId: string): boolean;
    };

    readContractWatcher: {
        create(
            contractAddress: Address,
            network: ConceroNetwork,
            functionName: string,
            abi: Abi,
            callback: (result: any, network: ConceroNetwork) => Promise<void>,
            intervalMs?: number,
            args?: any[],
        ): string;
        remove(watcherId: string): boolean;
    };

    // Transaction status methods
    getPendingTransactions(chainName?: string): any[];

    dispose(): void;
}
