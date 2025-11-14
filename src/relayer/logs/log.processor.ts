import { ConceroNetwork } from '@concero/operator-utils';
import { MessageReportLogStrategy } from './message-report-log.strategy';
import { MessageSentLogStrategy } from './message-sent-log.strategy';
import { LogStrategy, LogType } from './types';

import { RelayerContext } from '../relayer-context';
import { Context } from '../types';

export class LogProcessor extends RelayerContext {
    private readonly strategies: Record<LogType, LogStrategy>;

    constructor(context: Context) {
        super('LogProcessor', context);
        this.strategies = {
            [LogType.MessageSent]: new MessageSentLogStrategy(this.context),
            [LogType.ReportRequested]: new MessageReportLogStrategy(this.context),
        };
    }

    private getPipeline(type: LogType): LogStrategy['onLogs'] {
        return this.strategies[type].onLogs;
    }

    async startWatcher() {
        const activeNetworks: ConceroNetwork[] = this.context.network.getActiveNetworks();
        for (const network of activeNetworks) {
            const routerBlockManager = this.context.blockRegistry.getBlockManager(network.name);

            if (!routerBlockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            try {
                const routerAddress = await this.context.messagingDeployment.getRouterByChainName(
                    network.name,
                );

                await this.context.txReader.logWatcher.create(
                    routerAddress,
                    network,
                    this.getPipeline(LogType.MessageSent),
                    this.context.config.event.messageSent,
                    routerBlockManager,
                );
                this.logger.debug(`Created ${LogType.MessageSent} watcher for ${network.name}`);
            } catch (error) {
                this.logger.error(`Failed to set up router listener for ${network.name}: ${error}`);
            }
        }

        const verifierBlockManager = this.context.blockRegistry.getBlockManager(
            this.context.verifierNetwork.name,
        );

        if (!verifierBlockManager) {
            this.logger.error(
                `No block manager available for verifier network ${this.context.verifierNetwork.name}`,
            );
            return;
        }

        try {
            await this.context.txReader.logWatcher.create(
                this.context.verifierAddress,
                this.context.verifierNetwork,
                this.getPipeline(LogType.ReportRequested),
                this.context.config.event.messageReport,
                verifierBlockManager,
            );
            this.logger.debug(
                `Created ${LogType.ReportRequested} watcher for ${this.context.verifierNetwork.name}`,
            );
        } catch (error) {
            this.logger.error(
                `Failed to set up verifier listener for ${this.context.verifierNetwork.name}: ${error}`,
            );
        }
    }
}
