import { Log } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { MessagingCodec } from './codec';
import { LogParserService } from './services';
import { Context, MessageSentLogData } from './types';
import { VerifierType } from './verifier';

import { ContextProvider } from './services/context.provider';

export class LogProcessor extends ContextProvider {
    private readonly parser: LogParserService;

    constructor(context: Context) {
        super('LogProcessor', context);
        this.parser = new LogParserService(context);
    }

    async init() {
        const onLogs = this.onLogs.bind(this);
        const activeNetworks: ConceroNetwork[] = this.context.network.getActiveNetworks();
        this.logger.debug(
            `Got ${activeNetworks.length} active networks: ${activeNetworks.map(i => i.name).join(', ')}`,
        );

        for (const network of activeNetworks) {
            const blockManager = this.context.blockRegistry.getBlockManager(network.name);

            if (!blockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            try {
                const routerAddress = this.context.messagingDeployment.getRouterByChainName(
                    network.name,
                );
                await this.context.txReader.logWatcher.create(
                    routerAddress,
                    network,
                    onLogs,
                    this.context.config.event.messageSent,
                    blockManager,
                );

                await blockManager.startPolling();
                this.logger.debug(`Created MessageSent watcher for ${network.name}`);
            } catch (error) {
                this.logger.error(`Failed to set up router listener for ${network.name}: ${error}`);
            }
        }
    }

    private async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        try {
            this.logger.debug(`Found ${logs.length} logs`);

            if (logs.length === 0) {
                return;
            }

            this.logger.debug(
                `Processing ${logs.length} ConceroMessageSent events from ${network.name}`,
            );

            const parsedLogs = this.parser.parseLogs<MessageSentLogData>(
                logs,
                this.context.config.contract.router,
            );

            for (const parsedLog of parsedLogs) {
                const parsedReceipt = MessagingCodec.decodeReceipt(parsedLog.data.messageReceipt);
                const shouldFinaliseSrc = parsedReceipt.srcChainData.blockConfirmations !== 0n;
                if (shouldFinaliseSrc) {
                    this.context.txMonitor.trackTxFinality(
                        parsedLog.transactionHash,
                        network.name,
                        // @todo: move to separate polling service
                        'relayer',
                    );
                } else {
                    const isCRE = parsedLog.data.validatorLibs.length > 0;
                    this.context.eventBus.requestVerify({
                        ...parsedLog,
                        data: {
                            ...parsedLog.data,
                            parsedReceipt,
                        },
                        type: isCRE ? VerifierType.CRE : VerifierType.Empty,
                    });
                }
            }
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }
}
