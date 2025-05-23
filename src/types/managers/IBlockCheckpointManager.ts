export interface IBlockCheckpointManager {
    initialize(): Promise<void>;
    getCheckpoint(network: { name: string }): Promise<bigint | undefined>;
    updateLastProcessedBlock(networkName: string, blockNumber: bigint): Promise<void>;
    dispose(): void;
}
