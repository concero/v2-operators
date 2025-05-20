export interface IBlockCheckpointManager {
    initialize(): Promise<void>;
    getLastProcessedBlock(network: { name: string }): Promise<bigint | undefined>;
    determineStartingBlock(
        network: { name: string },
        publicClient: { getBlockNumber: () => Promise<bigint> },
    ): Promise<bigint>;
    updateLastProcessedBlock(networkName: string, blockNumber: bigint): Promise<void>;
    getAllCheckpoints(): Promise<any[]>;
    deleteCheckpoint(network: { name: string }): Promise<void>;
    dispose(): void;
}
