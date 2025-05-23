import { PublicClient } from "viem";

import { globalConfig } from "../../constants/globalConfig";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IBlockManager } from "../../types/managers/IBlockManager";
import { logger } from "../utils/logger";

import { BlockCheckpointManager } from "./BlockCheckpointManager";

/**
 * BlockManager encapsulates block processing and canonical block emission for a single network.
 * It handles both the polling for new blocks and notifying registered handlers about block ranges.
 */

/** Options for watching blocks */
type WatchBlocksOptions = {
    onBlockRange: (startBlock: bigint, endBlock: bigint) => Promise<void>;
    onError?: (err: unknown) => void;
};

type BlockRangeHandler = {
    id: string;
    onBlockRange: (startBlock: bigint, endBlock: bigint) => Promise<void>;
    onError?: (err: unknown) => void;
};

export class BlockManager implements IBlockManager {
    private lastProcessedBlockNumber: bigint;
    private latestBlock: bigint | null = null;
    public readonly publicClient: PublicClient;
    private network: ConceroNetwork;
    private blockCheckpointManager: BlockCheckpointManager;
    private blockRangeHandlers: Map<string, BlockRangeHandler> = new Map();

    private isDisposed: boolean = false;
    private isPolling: boolean = false;
    private pollingIntervalMs: number = globalConfig.POLLING_INTERVAL_MS;
    private pollingTimeout: NodeJS.Timeout | null = null;

    private constructor(
        initialBlock: bigint,
        network: ConceroNetwork,
        publicClient: PublicClient,
        blockCheckpointManager: BlockCheckpointManager,
    ) {
        this.lastProcessedBlockNumber = initialBlock;
        this.publicClient = publicClient;
        this.network = network;
        this.blockCheckpointManager = blockCheckpointManager;
    }

    static async create(
        network: ConceroNetwork,
        publicClient: PublicClient,
        blockCheckpointManager: BlockCheckpointManager,
    ): Promise<BlockManager> {
        let initialBlock: bigint;

        if (!globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS) {
            initialBlock = await publicClient.getBlockNumber();
            logger.info(
                `[BlockManager] ${network.name}: Checkpoints disabled. Starting from current chain tip: ${initialBlock}`,
            );
        } else {
            const savedBlock = await blockCheckpointManager.getCheckpoint(network);
            if (savedBlock !== undefined) {
                logger.info(
                    `[BlockManager] ${network.name}: Resuming from previously saved block ${savedBlock}`,
                );
                initialBlock = savedBlock;
            } else {
                initialBlock = await publicClient.getBlockNumber();
                logger.debug(
                    `[BlockManager] ${network.name}: No checkpoint found. Starting from current chain tip: ${initialBlock}`,
                );
            }
        }

        logger.debug(
            `[BlockManager] ${network.name}: Creating new instance with initial block ${initialBlock}`,
        );

        const blockManager = new BlockManager(
            initialBlock,
            network,
            publicClient,
            blockCheckpointManager,
        );

        return blockManager;
    }

    public async startPolling(): Promise<void> {
        if (this.isPolling) {
            logger.debug(
                `[BlockManager] ${this.network.name}: Already polling, ignoring start request`,
            );
            return;
        }

        this.isPolling = true;

        logger.debug(`[BlockManager] ${this.network.name}: Starting block polling`);
        await this.performCatchup();
        await this.poll();
    }

    private stopPolling(): void {
        if (!this.isPolling) {
            return;
        }

        logger.info(`[BlockManager] ${this.network.name}: Stopping block polling`);
        this.isPolling = false;

        if (this.pollingTimeout) {
            clearTimeout(this.pollingTimeout);
            this.pollingTimeout = null;
        }
    }

    private async poll(): Promise<void> {
        if (!this.isPolling || this.isDisposed) {
            return;
        }

        try {
            this.latestBlock = await this.publicClient.getBlockNumber();

            if (this.latestBlock > this.lastProcessedBlockNumber) {
                const startBlock = this.lastProcessedBlockNumber + 1n;
                logger.debug(
                    `[BlockManager] ${this.network.name}: Processing ${this.latestBlock - startBlock + 1n} new blocks from ${startBlock} to ${this.latestBlock}`,
                );
                await this.processBlockRange(startBlock, this.latestBlock);
            }
        } catch (error) {
            logger.error(`[BlockManager] ${this.network.name}: Error in poll cycle:`, error);
        } finally {
            if (this.isPolling && !this.isDisposed) {
                this.pollingTimeout = setTimeout(() => this.poll(), this.pollingIntervalMs);
            }
        }
    }

    public async getLatestBlock(): Promise<bigint | null> {
        return this.latestBlock;
    }

    /**
     * Process a range of blocks by:
     * 1. Notifying all registered handlers about the new block range
     * 2. Updating the last processed block checkpoint
     */
    private async processBlockRange(startBlock: bigint, endBlock: bigint): Promise<void> {
        // Notify all registered handlers about the new block range
        if (this.blockRangeHandlers.size > 0) {
            // logger.debug(
            //     `[BlockManager] ${this.network.name}: Notifying ${this.blockRangeHandlers.size} handlers about blocks ${startBlock} - ${endBlock}`,
            // );

            for (const handler of this.blockRangeHandlers.values()) {
                try {
                    await handler.onBlockRange(startBlock, endBlock);
                } catch (error) {
                    logger.error(
                        `[BlockManager] ${this.network.name}: Error in block range handler ${handler.id}:`,
                        error,
                    );
                    if (handler.onError) {
                        handler.onError(error);
                    }
                }
            }
        }
        await this.updateLastProcessedBlock(endBlock);
    }

    /**
     * Update the last processed block checkpoint
     */
    private async updateLastProcessedBlock(blockNumber: bigint): Promise<void> {
        // logger.debug(
        //     `[BlockManager] ${this.network.name}: Updating last processed block to ${blockNumber} (previous: ${this.lastProcessedBlockNumber})`,
        // );
        await this.blockCheckpointManager.updateLastProcessedBlock(this.network.name, blockNumber);
        this.lastProcessedBlockNumber = blockNumber;
    }

    /**
     * Initiates a catchup process from the current processed block to the latest block.
     * This is typically called during initialization.
     */
    private async performCatchup(): Promise<void> {
        if (this.isDisposed) {
            logger.debug(`[BlockManager] ${this.network.name}: Already disposed, skipping catchup`);
            return;
        }

        try {
            this.latestBlock = await this.publicClient.getBlockNumber();
            let currentBlock: bigint = this.lastProcessedBlockNumber;

            logger.info(
                `[BlockManager] ${this.network.name}: Starting catchup from block ${currentBlock}, Chain tip: ${this.latestBlock}`,
            );

            while (currentBlock < this.latestBlock && !this.isDisposed) {
                const startBlock = currentBlock + 1n;
                const endBlock =
                    startBlock + globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE - 1n >
                    this.latestBlock
                        ? this.latestBlock
                        : startBlock + globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE - 1n;

                logger.debug(
                    `[BlockManager] ${this.network.name}: Processing ${endBlock - startBlock + 1n} blocks from ${startBlock} - ${endBlock}`,
                );

                // Process this block range (will notify handlers)
                await this.processBlockRange(startBlock, endBlock);
                currentBlock = endBlock;
            }
        } catch (err) {
            logger.error(`[BlockManager] ${this.network.name}:`, err);
        }
    }

    /**
     * Registers a handler that will be called when new blocks are processed.
     * Returns an unregister function.
     */
    public watchBlocks(options: WatchBlocksOptions): () => void {
        const { onBlockRange, onError } = options;
        const handlerId = Math.random().toString(36).substring(2, 15);

        // logger.debug(
        //     `[BlockManager] ${this.network.name}: Registered block range handler ${handlerId}`,
        // );

        this.blockRangeHandlers.set(handlerId, {
            id: handlerId,
            onBlockRange,
            onError,
        });

        return () => {
            logger.info(
                `[BlockManager] ${this.network.name}: Unregistered block range handler ${handlerId}`,
            );
            this.blockRangeHandlers.delete(handlerId);
        };
    }

    public dispose(): void {
        this.isDisposed = true;
        this.stopPolling();
        this.blockRangeHandlers.clear();
        logger.debug(`[BlockManager] ${this.network.name}: Disposed`);
    }
}
