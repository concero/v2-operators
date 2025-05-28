import { AbiEvent, Address, Log } from "viem";

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
    chainName: string;
    contractAddress: Address;
    event?: AbiEvent;
    callback: (logs: Log[], network: ConceroNetwork) => Promise<void>;
}

export interface ITxReader {
    getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]>;

    logWatcher: {
        create(
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
        ): string;
        remove(watcherId: string): boolean;
    };

    fetchLogsForWatchers(chainName: string, fromBlock: bigint, toBlock: bigint): Promise<void>;

    initialize(): Promise<void>;
    dispose(): void;
}
