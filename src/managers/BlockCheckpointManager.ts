import { LoggerInterface } from '@concero/operator-utils';

import { PrismaClient } from '../../generated/prisma';
import { Nullable } from '../types/common';
import { BlockCheckpointManagerConfig } from '../types/ManagerConfigs';

export class BlockCheckpointManager implements IBlockCheckpointManager {
    private config: BlockCheckpointManagerConfig;

    constructor(
        config: BlockCheckpointManagerConfig,
        private logger: LoggerInterface,
        private dbClient: Nullable<PrismaClient>,
    ) {
        this.logger = logger;
        this.config = config;
    }

    async getCheckpoint(chainSelector: number): Promise<bigint | undefined> {
        if (!this.dbClient) return undefined;

        const checkpoint = await this.dbClient.blockCheckpoint.findUnique({
            where: { chainSelector: chainSelector },
        });

        if (checkpoint) {
            return checkpoint.blockNumber;
        } else {
            this.logger.debug(`No checkpoint found for network ${chainSelector}`);
        }
    }

    async updateLastProcessedBlock(chainSelector: number, blockNumber: bigint) {
        if (!this.dbClient) return;
        if (!this.config.useCheckpoints) return;

        try {
            await this.dbClient.blockCheckpoint.upsert({
                where: { chainSelector },
                update: { blockNumber },
                create: { chainSelector, blockNumber },
            });
        } catch (error) {
            this.logger.error(
                `Upsert failed for network: ${chainSelector}, blockNumber: ${blockNumber.toString()}: ${error}`,
            );
            throw error;
        }
    }
}
