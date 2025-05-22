export interface IBlockManagerRegistry {
    initialize(): Promise<void>;
    onNetworksUpdated(networks: any[]): void;
    createBlockManager(network: any, publicClient: any): Promise<any>;
    getBlockManager(networkName: string): any | null;
    getAllManagedNetworks(): string[];
    getLatestBlockForChain(networkName: string): Promise<bigint | null>;
    dispose(): void;
}
