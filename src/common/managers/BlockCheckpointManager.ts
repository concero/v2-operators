import { LoggerInterface } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { BlockCheckpointManagerConfig } from "../../types/ManagerConfigs";
import { IBlockCheckpointManager } from "../../types/managers/";

import { DbManager } from "./DbManager";
import { ManagerBase } from "./ManagerBase";

export class BlockCheckpointManager extends ManagerBase implements IBlockCheckpointManager {
    private static instance: BlockCheckpointManager;
    private prisma = DbManager.getClient();
    private logger: LoggerInterface;
    private config: BlockCheckpointManagerConfig;

    private constructor(logger: LoggerInterface, config: BlockCheckpointManagerConfig) {
        super();
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        config: BlockCheckpointManagerConfig,
    ): BlockCheckpointManager {
        BlockCheckpointManager.instance = new BlockCheckpointManager(logger, config);
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
            this.logger.debug(
                `Found checkpoint at block ${checkpoint} for network ${network.name}`,
            );
            return BigInt(checkpoint.blockNumber.toString());
        } else {
            this.logger.debug(`No checkpoint found for network ${network.name}`);
        }
    }

    async updateLastProcessedBlock(networkName: string, blockNumber: bigint): Promise<void> {
        if (!this.config.useCheckpoints) return;

        try {
            await this.prisma.blockCheckpoint.upsert({
                where: { network: networkName },
                update: { blockNumber },
                create: {
                    network: networkName,
                    blockNumber,
                },
            });
            // this.logger.debug(
            //     `Upsert successful for network: ${networkName}, blockNumber: ${blockNumber.toString()}`,
            // );
        } catch (error) {
            this.logger.error(
                `Upsert failed for network: ${networkName}, blockNumber: ${blockNumber.toString()}`,
                error,
            );
            throw error;
        }
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await super.initialize();
        this.logger.debug("Initialized");
    }

    public override dispose(): void {
        super.dispose();
        this.logger.debug("Disposed");
    }
}
