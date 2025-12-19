import { Log } from 'viem';
import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { LogPipelineService } from './log-pipeline.service';

import { ChainsSetupService } from '../services';
import { Context } from '../types';

export class LogModule extends ChainsSetupService {
    private readonly pipeline: LogPipelineService;

    constructor(context: Context) {
        super('LogModule', context);
        this.pipeline = new LogPipelineService(context);
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        const onLogs = this.onLogs.bind(this);

        try {
            const routerAddress = this.context.deploymentManager.getRouterByChainSelector(
                Number(network.chainSelector),
            );

            await this.context.txReader.logWatcher.create(
                routerAddress,
                network,
                onLogs,
                this.context.config.event.messageSent,
                blockManager,
            );

            this.logger.debug(`Created MessageSent watcher for ${network.name}`);
        } catch (error) {
            this.logger.error(`Failed to set up router listener for ${network.name}: ${error}`);
        }
    }

    private async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
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
