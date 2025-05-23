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

    async getCheckpoint(network: ConceroNetwork): Promise<bigint | undefined> {
        const checkpoint = await this.prisma.blockCheckpoint.findUnique({
            where: { network: network.name },
        });

        if (checkpoint) {
            logger.debug(
                `[BlockCheckpointManager]: Found checkpoint at block ${checkpoint} for network ${network.name}`,
            );
            return BigInt(checkpoint.blockNumber.toString());
        } else {
            logger.debug(
                `[BlockCheckpointManager]: No checkpoint found for network ${network.name}`,
            );
        }
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
