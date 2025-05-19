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
    public readonly publicClient: PublicClient;
    private network: ConceroNetwork;
    private blockCheckpointManager: BlockCheckpointManager;
    private blockRangeHandlers: Map<string, BlockRangeHandler> = new Map();

    private isDisposed: boolean = false;
    private isPolling: boolean = false;
    private pollingIntervalMs: number = globalConfig.POLLING_INTERVAL_MS;
    private pollingTimeout: NodeJS.Timeout | null = null;
    private isPollInProgress: boolean = false;

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
        const initialBlock = await blockCheckpointManager.determineStartingBlock(
            network,
            publicClient,
        );

        logger.debug(
            `[BlockManager] ${network.name}: Creating new instance with initial block ${initialBlock}`,
        );

        const blockManager = new BlockManager(
            initialBlock,
            network,
            publicClient,
            blockCheckpointManager,
        );

        // Start the polling process after creation
        await blockManager.startPolling();

        return blockManager;
    }

    /**
     * Start the polling process to check for new blocks at regular intervals
     */
    private async startPolling(): Promise<void> {
        if (this.isPolling) {
            logger.debug(
                `[BlockManager] ${this.network.name}: Already polling, ignoring start request`,
            );
            return;
        }

        this.isPolling = true;

        // Perform initial catchup
        await this.performCatchup();

        // Then start regular polling
        await this.poll();
    }

    /**
     * Stop the polling process
     */
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

    /**
     * Poll for new blocks and process them
     */
    private async poll(): Promise<void> {
        if (!this.isPolling || this.isDisposed) {
            return;
        }

        // Prevent concurrent polling
        if (this.isPollInProgress) {
            this.pollingTimeout = setTimeout(() => this.poll(), this.pollingIntervalMs);
            return;
        }

        this.isPollInProgress = true;
        try {
            const latestBlock = await this.publicClient.getBlockNumber();

            // If there are new blocks, process them
            if (latestBlock > this.lastProcessedBlockNumber) {
                const startBlock = this.lastProcessedBlockNumber + 1n;
                logger.debug(
                    `[BlockManager] ${this.network.name}: Processing ${latestBlock - startBlock + 1n} new blocks from ${startBlock} to ${latestBlock}`,
                );
                await this.processBlockRange(startBlock, latestBlock);
            }
        } catch (error) {
            logger.error(`[BlockManager] ${this.network.name}: Error in poll cycle:`, error);
        } finally {
            this.isPollInProgress = false;

            // Schedule the next poll if still running
            if (this.isPolling && !this.isDisposed) {
                this.pollingTimeout = setTimeout(() => this.poll(), this.pollingIntervalMs);
            }
        }
    }

    public async getLatestBlock(): Promise<bigint | null> {
        try {
            return await this.publicClient.getBlockNumber();
        } catch (error) {
            logger.error(
                `[BlockManager]: Failed to get latest block for ${this.network.name}`,
                error,
            );
            return null;
        }
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

        // Update the last processed block checkpoint
        await this.updateLastProcessedBlock(endBlock);
    }

    /**
     * Update the last processed block checkpoint
     */
    private async updateLastProcessedBlock(blockNumber: bigint): Promise<void> {
        logger.debug(
            `[BlockManager] ${this.network.name}: Updating last processed block to ${blockNumber} (previous: ${this.lastProcessedBlockNumber})`,
        );
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
            const checkpoint = await this.blockCheckpointManager.getLastProcessedBlock(
                this.network,
            );
            const latestBlock = await this.publicClient.getBlockNumber();
            let currentBlock = checkpoint ?? latestBlock;

            logger.info(
                `[BlockManager] ${this.network.name}: Catchup from DB checkpoint: ${checkpoint?.toString() ?? "None"}, Using block: ${currentBlock}, Chain tip: ${latestBlock}`,
            );

            while (currentBlock < latestBlock && !this.isDisposed) {
                const startBlock = currentBlock + 1n;
                const endBlock =
                    startBlock + globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE - 1n > latestBlock
                        ? latestBlock
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

        logger.debug(
            `[BlockManager] ${this.network.name}: Registered block range handler ${handlerId}`,
        );

        // Register the handler
        this.blockRangeHandlers.set(handlerId, {
            id: handlerId,
            onBlockRange,
            onError,
        });

        // Return the unregister function
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
