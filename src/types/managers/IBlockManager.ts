export interface IBlockManager {
    getLatestBlock(): Promise<bigint | null>;
    watchBlocks(options: {
        onBlockRange: (startBlock: bigint, endBlock: bigint) => Promise<void>;
        onError?: (err: unknown) => void;
    }): () => void;
    dispose(): void;
}
