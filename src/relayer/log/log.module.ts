import { Log } from 'viem';
import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { LogExtractorService } from './log-extractor.service';
import { LogPipelineService } from './log-pipeline.service';

import { Nullable } from '../../types/common';
import { ChainsSetupService } from '../services/chains-setup.service';
import { Context } from '../types';

export class LogModule extends ChainsSetupService {
    private readonly pipeline: LogPipelineService;
    private readonly extractor: LogExtractorService;

    constructor(context: Context) {
        super('LogModule', context);
        this.pipeline = new LogPipelineService(context);
        this.extractor = new LogExtractorService(context);
    }

    protected setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        const onLogs = this.onLogs.bind(this);

        try {
            const routerAddress = this.context.chainsManager.getRouterByChainSelector(
                Number(network.chainSelector),
            );

            this.context.txReader.logWatcher
                .create(
                    routerAddress,
                    network,
                    onLogs,
                    this.context.config.messageSentEventAbi,
                    blockManager,
                )
                .catch(this.logger.error)
                .then(this.logger.info);

            this.logger.info(`Created MessageSent watcher for ${network.name}`);
        } catch (error) {
            this.logger.error(`Failed to set up router listener for ${network.name}: ${error}`);
        }
    }

    async refetchLog(
        srcChainSelector: number,
        blockNumber: bigint,
        messageId: string,
    ): Promise<Nullable<string>> {
        try {
            const srcNetworkName =
                this.context.chainsManager.getNetworkNameByChainSelector(srcChainSelector);
            const extractedLog = await this.extractor.extractLog(
                srcChainSelector,
                srcNetworkName,
                blockNumber,
                messageId,
            );

            if (!extractedLog) {
                this.logger.error(
                    `Log [messageId=${messageId}, blockNumber=${String(blockNumber)}, srcChain=${srcNetworkName}] not found`,
                );
                return `Log [messageId=${messageId}, blockNumber=${String(blockNumber)}, srcChain=${srcNetworkName}] not found`;
            }

            const network = this.context.network.getNetworkByName(srcNetworkName);

            await this.onLogs([extractedLog], network);

            return null;
        } catch (e) {
            this.logger.error(
                `Log [messageId=${messageId}, blockNumber=${String(blockNumber)}, srcChainSelector=${srcChainSelector}] refetch failed: ${e}`,
            );
            return `Log [messageId=${messageId}, blockNumber=${String(blockNumber)}, srcChainSelector=${srcChainSelector}] refetch failed: ${e}`;
        }
    }

    protected async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        try {
            this.logger.info(
                `ConceroMessageSent (size=${logs.length}): ${logs.map(i => i.transactionHash).join(', ')}`,
            );

            const promises = logs.map(async log => {
                return this.pipeline.execute(network, log);
            });

            await Promise.all(promises);
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }
}
