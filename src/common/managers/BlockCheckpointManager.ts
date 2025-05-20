import { BlockCheckpoint } from "@prisma/client";

import { globalConfig } from "../../constants/globalConfig";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IBlockCheckpointManager } from "../../types/managers/IBlockCheckpointManager";
import { logger } from "../utils";

import { DbManager } from "./DbManager";
import { ManagerBase } from "./ManagerBase";

export class BlockCheckpointManager extends ManagerBase implements IBlockCheckpointManager {
    private static instance: BlockCheckpointManager;
    private prisma = DbManager.getClient();

    private constructor() {
        super();
    }

    public static createInstance(): BlockCheckpointManager {
        BlockCheckpointManager.instance = new BlockCheckpointManager();
        return BlockCheckpointManager.instance;
    }
    public static getInstance(): BlockCheckpointManager {
        if (!BlockCheckpointManager.instance) {
            throw new Error(
                "BlockCheckpointManager is not initialized. Call createInstance() first.",
            );
        }
        return BlockCheckpointManager.instance;
    }

    async getLastProcessedBlock(network: ConceroNetwork): Promise<bigint | undefined> {
        const checkpoint = await this.prisma.blockCheckpoint.findUnique({
            where: { network: network.name },
        });
        if (checkpoint) {
            return BigInt(checkpoint.blockNumber.toString());
        }
        return undefined;
    }

    async determineStartingBlock(
        network: ConceroNetwork,
        publicClient: { getBlockNumber: () => Promise<bigint> },
    ): Promise<bigint> {
        const currentBlock = await publicClient.getBlockNumber();

        if (!globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS) {
            logger.info(
                `[BlockCheckpointManager]: Checkpoints disabled. Starting from current chain tip: ${currentBlock} for network ${network.name}`,
            );
            return currentBlock;
        }

        const savedBlock = await this.getLastProcessedBlock(network);
        if (savedBlock !== undefined) {
            logger.info(
                `[BlockCheckpointManager]: Resuming from previously saved block ${savedBlock} for network ${network.name}`,
            );
            return savedBlock;
        }

        logger.debug(
            `[BlockCheckpointManager]: No checkpoint found. Starting from current chain tip: ${currentBlock} for network ${network.name}`,
        );
        return currentBlock;
    }

    async updateLastProcessedBlock(networkName: string, blockNumber: bigint): Promise<void> {
        try {
            await this.prisma.blockCheckpoint.upsert({
                where: { network: networkName },
                update: { blockNumber },
                create: {
                    network: networkName,
                    blockNumber,
                },
            });
            // logger.debug(
            //     `[BlockCheckpointManager] Upsert successful for network: ${networkName}, blockNumber: ${blockNumber.toString()}`,
            // );
        } catch (error) {
            logger.error(
                `[BlockCheckpointManager] Upsert failed for network: ${networkName}, blockNumber: ${blockNumber.toString()}`,
                error,
            );
            throw error;
        }
    }

    async getAllCheckpoints(): Promise<BlockCheckpoint[]> {
        return this.prisma.blockCheckpoint.findMany();
    }

    async deleteCheckpoint(network: ConceroNetwork): Promise<void> {
        logger.debug(`[BlockCheckpointManager] Deleting checkpoint for network: ${network.name}`);
        await this.prisma.blockCheckpoint.delete({
            where: { network: network.name },
        });
        logger.info(`[BlockCheckpointManager] Deleted checkpoint for network: ${network.name}`);
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await super.initialize();
        logger.debug("[BlockCheckpointManager]: Initialized successfully");
    }

    public override dispose(): void {
        super.dispose();
        logger.debug("[BlockCheckpointManager]: Disposed");
    }
}
