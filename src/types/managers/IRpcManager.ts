import { ConceroNetwork } from "../ConceroNetwork";

import { RpcUpdateListener } from "./RpcUpdateListener";

export interface IRpcManager {
    initialize(): Promise<void>;
    ensureRpcsForNetwork(network: ConceroNetwork): Promise<void>;
    updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    registerRpcUpdateListener(listener: RpcUpdateListener): void;
    unregisterRpcUpdateListener(listener: RpcUpdateListener): void;
    getRpcsForNetwork(networkName: string): string[];
}
