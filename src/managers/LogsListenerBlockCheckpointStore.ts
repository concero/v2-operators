import { Address } from 'viem';
import { LoggerInterface } from '@concero/operator-utils';
import { ILogsListenerBlockCheckpointStore } from '@concero/operator-utils/dist/types/managers/ILogsListenerBlockCheckpointStore';
import { PrismaClient } from '@prisma/client';

import { Nullable } from '../types/common';

export class LogsListenerBlockCheckpointStore implements ILogsListenerBlockCheckpointStore {
    constructor(
        private logger: LoggerInterface,
        private dbClient: Nullable<PrismaClient>,
    ) {
        this.logger = logger;
    }

    async getBlockCheckpoint(chainSelector: number, contractAddress: Address) {
        if (!this.dbClient) return undefined;

        const checkpoint = await this.dbClient.logsListenerBlockCheckpoints.findUnique({
            where: { chainSelector_contractAddress: { chainSelector, contractAddress } },
        });

        if (checkpoint) {
            return checkpoint.blockNumber;
        } else {
            this.logger.debug(`No checkpoint found for network ${chainSelector}`);
        }
    }

    async updateBlockCheckpoint(
        chainSelector: number,
        contractAddress: Address,
        blockNumber: bigint,
    ) {
        if (!this.dbClient) return;

        try {
            await this.dbClient.logsListenerBlockCheckpoints.upsert({
                where: { chainSelector_contractAddress: { chainSelector, contractAddress } },
                update: { blockNumber },
                create: { chainSelector, blockNumber, contractAddress },
            });
        } catch (error) {
            this.logger.error(
                `Upsert failed for network: ${chainSelector}, blockNumber: ${blockNumber.toString()}: ${error}`,
            );
            throw error;
        }
    }
}
