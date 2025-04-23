import { Address } from "viem";
import { ViemClients } from "../relayer/common/managers/ViemClientManager";
import { ConceroNetwork, ConceroNetworkNames } from "./ConceroNetwork";

export interface INetworkManager {
    getMainnetNetworks(): Record<string, ConceroNetwork>;
    getTestnetNetworks(): Record<string, ConceroNetwork>;
    getAllNetworks(): Record<string, ConceroNetwork>;
    getActiveNetworks(): ConceroNetwork[];
    getNetworkById(chainId: number): ConceroNetwork | undefined;
    getNetworkByName(name: string): ConceroNetwork | undefined;
    getNetworkBySelector(selector: string): ConceroNetwork | undefined;
    getVerifierNetwork(): ConceroNetwork | undefined;
    forceUpdate(): Promise<void>;
    registerUpdateListener(listener: NetworkUpdateListener): void;
    unregisterUpdateListener(listener: NetworkUpdateListener): void;
    initialize(): Promise<void>;
    dispose(): void;
}

export interface IRpcManager {
    ensureRpcsForNetwork(network: ConceroNetwork): Promise<void>;
    updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    registerRpcUpdateListener(listener: RpcUpdateListener): void;
    unregisterRpcUpdateListener(listener: RpcUpdateListener): void;
    getRpcsForNetwork(networkName: string): string[];
}

export interface NetworkUpdateListener {
    onNetworksUpdated(networks: ConceroNetwork[]): void;
}

export interface RpcUpdateListener {
    onRpcUrlsUpdated(networks: ConceroNetwork[]): void;
}

export interface IDeploymentsManager extends NetworkUpdateListener {
    getRouterByChainName(chainName: ConceroNetworkNames): Promise<Address>;
    getConceroVerifier(): Promise<Address>;
    updateDeployments(): Promise<void>;
}

export interface IViemClientManager {
    initialize(): Promise<void>;
    getClients(chain: ConceroNetwork): ViemClients;
    onRpcUrlsUpdated(networks: ConceroNetwork[]): void;
    dispose(): void;
}
