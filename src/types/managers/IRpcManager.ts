import { ConceroNetwork } from "../ConceroNetwork";

export interface IRpcManager {
    initialize(): Promise<void>;
    ensureRpcsForNetwork(network: ConceroNetwork): Promise<void>;
    updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    getRpcsForNetwork(networkName: string): string[];
}
