import { Abi, AbiEvent, Address, Log } from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

export interface LogQuery {
    address: Address;
    event: AbiEvent;
    args?: Record<string, any>;
    fromBlock: bigint;
    toBlock: bigint;
}

export interface LogWatcher {
    id: string;
    network: ConceroNetwork;
    contractAddress: Address;
    event?: AbiEvent;
    callback: (logs: Log[], network: ConceroNetwork) => Promise<void>;
    blockManager: any;
    unwatch: () => void;
}

export interface ReadContractWatcher {
    id: string;
    network: ConceroNetwork;
    contractAddress: Address;
    functionName: string;
    abi: Abi;
    args?: any[];
    intervalMs: number;
    callback: (result: any, network: ConceroNetwork) => Promise<void>;
}

export interface ITxReader {
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

    initialize(): Promise<void>;
    dispose(): void;
}
