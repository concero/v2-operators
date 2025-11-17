import { Log } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { MessagingCodec } from './codec';
import { ContextProvider, LogParserService } from './services';
import { Context, MessageSentLogData } from './types';
import { VerifierProcessor, VerifierType } from './verifier';

export class LogProcessor extends ContextProvider {
    private readonly parser: LogParserService;

    constructor(context: Context) {
        super('LogProcessor', context);
        this.parser = new LogParserService(context);
    }

    async setup() {
        const onLogs = this.onLogs.bind(this);
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
                    onLogs,
                    this.context.config.event.messageSent,
                    routerBlockManager,
                );
                this.logger.debug(`Created MessageSent watcher for ${network.name}`);
            } catch (error) {
                this.logger.error(`Failed to set up router listener for ${network.name}: ${error}`);
            }
        }
    }

    private async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        try {
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
                const parsedReceipt = MessagingCodec.decodeReceipt(
                    Buffer.from(parsedLog.data.messageReceipt),
                );

                const shouldFinaliseSrc = parsedReceipt.srcBlockConfirmations !== 0n;
                if (shouldFinaliseSrc) {
                    this.context.txMonitor.trackTxFinality(
                        parsedLog.transactionHash,
                        network.name,
                        // @todo: move to separate polling service
                        'relayer',
                    );
                } else {
                    this.context.eventEmitter.emit(VerifierProcessor.command, {
                        ...parsedLog,
                        data: {
                            ...parsedLog.data,
                            parsedReceipt,
                        },
                        type: VerifierType.Empty,
                    } as VerifierProcessor.Payload);
                }
            }
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }
}
