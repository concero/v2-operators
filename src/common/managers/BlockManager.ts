import { PublicClient } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { BlockManagerConfig } from "../../types/ManagerConfigs";
import { IBlockManager } from "../../types/managers";
import { LoggerInterface } from "../utils";

import { IBlockCheckpointManager } from "../../types/managers";

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
    private blockCheckpointManager: IBlockCheckpointManager;
    private blockRangeHandlers: Map<string, BlockRangeHandler> = new Map();

    protected logger: LoggerInterface;
    private config: BlockManagerConfig;

    private isDisposed: boolean = false;
    private isPolling: boolean = false;
    private pollingIntervalMs: number;
    private pollingTimeout: NodeJS.Timeout | null = null;

    private constructor(
        initialBlock: bigint,
        network: ConceroNetwork,
        publicClient: PublicClient,
        blockCheckpointManager: IBlockCheckpointManager,
        logger: LoggerInterface,
        config: BlockManagerConfig,
    ) {
        this.lastProcessedBlockNumber = initialBlock;
        this.publicClient = publicClient;
        this.network = network;
        this.blockCheckpointManager = blockCheckpointManager;
        this.logger = logger;
        this.config = config;
        this.pollingIntervalMs = config.pollingIntervalMs;
    }

    static async create(
        network: ConceroNetwork,
        publicClient: PublicClient,
        blockCheckpointManager: IBlockCheckpointManager,
        logger: LoggerInterface,
        config: BlockManagerConfig,
    ): Promise<BlockManager> {
        let initialBlock: bigint;
        const staticLogger = logger;

        if (!config.useCheckpoints) {
            initialBlock = await publicClient.getBlockNumber();
            staticLogger.debug(
                `${network.name}: Checkpoints disabled. Starting from current chain tip: ${initialBlock}`,
            );
        } else {
            const savedBlock = await blockCheckpointManager.getCheckpoint(network);
            if (savedBlock !== undefined) {
                staticLogger.info(
                    `${network.name}: Resuming from previously saved block ${savedBlock}`,
                );
                initialBlock = savedBlock;
            } else {
                initialBlock = await publicClient.getBlockNumber();
                staticLogger.debug(
                    `${network.name}: No checkpoint found. Starting from current chain tip: ${initialBlock}`,
                );
            }
        }

        staticLogger.debug(
            `${network.name}: Creating new instance with initial block ${initialBlock}`,
        );

        const blockManager = new BlockManager(
            initialBlock,
            network,
            publicClient,
            blockCheckpointManager,
            logger,
            config,
        );

        return blockManager;
    }

    public async startPolling(): Promise<void> {
        if (this.isPolling) {
            this.logger.debug(`${this.network.name}: Already polling, ignoring start request`);
            return;
        }

        this.isPolling = true;

        await this.performCatchup();
        await this.poll();
    }

    private stopPolling(): void {
        if (!this.isPolling) {
            return;
        }

        this.logger.info(`${this.network.name}: Stopping block polling`);
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

                await this.processBlockRange(startBlock, this.latestBlock);
            }
        } catch (error) {
            this.logger.error(`${this.network.name}: Error in poll cycle:`, error);
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
        this.logger.debug(
            `${this.network.name}: Processing ${this.latestBlock - startBlock + 1n} new blocks from ${startBlock} to ${this.latestBlock}`,
        );

        if (this.blockRangeHandlers.size > 0) {
            // this.logger.debug(
            //     `${this.network.name}: Notifying ${this.blockRangeHandlers.size} handlers about blocks ${startBlock} - ${endBlock}`,
            // );

            for (const handler of this.blockRangeHandlers.values()) {
                try {
                    await handler.onBlockRange(startBlock, endBlock);
                } catch (error) {
                    this.logger.error(
                        `${this.network.name}: Error in block range handler ${handler.id}:`,
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
        // this.logger.debug(
        //     `${this.network.name}: Updating last processed block to ${blockNumber} (previous: ${this.lastProcessedBlockNumber})`,
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
            this.logger.debug(`${this.network.name}: Already disposed, skipping catchup`);
            return;
        }

        try {
            this.latestBlock = await this.publicClient.getBlockNumber();
            let currentBlock: bigint = this.lastProcessedBlockNumber;

            this.logger.debug(
                `${this.network.name}: Starting catchup from block ${currentBlock}, Chain tip: ${this.latestBlock}`,
            );

            while (currentBlock < this.latestBlock && !this.isDisposed) {
                const startBlock = currentBlock + 1n;
                const endBlock =
                    startBlock + this.config.catchupBatchSize - 1n > this.latestBlock
                        ? this.latestBlock
                        : startBlock + this.config.catchupBatchSize - 1n;

                // Process this block range (will notify handlers)
                await this.processBlockRange(startBlock, endBlock);
                currentBlock = endBlock;
            }
        } catch (err) {
            this.logger.error(`${this.network.name}:`, err);
        }
    }

    /**
     * Registers a handler that will be called when new blocks are processed.
     * Returns an unregister function.
     */
    public watchBlocks(options: WatchBlocksOptions): () => void {
        const { onBlockRange, onError } = options;
        const handlerId = Math.random().toString(36).substring(2, 15);

        // this.logger.debug(
        //     `${this.network.name}: Registered block range handler ${handlerId}`,
        // );

        this.blockRangeHandlers.set(handlerId, {
            id: handlerId,
            onBlockRange,
            onError,
        });

        return () => {
            this.logger.info(`${this.network.name}: Unregistered block range handler ${handlerId}`);
            this.blockRangeHandlers.delete(handlerId);
        };
    }

    public dispose(): void {
        this.isDisposed = true;
        this.stopPolling();
        this.blockRangeHandlers.clear();
        this.logger.debug(`${this.network.name}: Disposed`);
    }
}
