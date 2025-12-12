import { Log, maxUint64 } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseLogService } from './base-log.service';
import { LogFinalityService } from './log-finality.service';

import { MessagingCodec } from '../codec';
import { LogParserService } from '../services';
import { Context, DecodedMessageLogReceipt, MessageSentLogData } from '../types';
import { VerifierType } from '../verifier';

export class LogWatcherService extends BaseLogService {
    private readonly parser: LogParserService;
    private readonly logFinalityService: LogFinalityService;

    constructor(context: Context, logFinalityService: LogFinalityService) {
        super('LogWatcherService', context);
        this.parser = new LogParserService(context);
        this.logFinalityService = logFinalityService;
    }

    async init() {
        const onLogs = this.onLogs.bind(this);

        this.forEachActiveNetwork(async (network, blockManager) => {
            try {
                const routerAddress = this.context.deploymentManager.getRouterByChainName(
                    network.name,
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
        });
    }

    private async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        try {
            this.logger.debug(`Found ${logs.length} logs`);

            if (logs.length === 0) {
                return;
            }

            this.logger.debug(`Logs: ${logs.map(i => i.transactionHash).join(', ')}`);

            this.logger.debug(
                `Processing ${logs.length} ConceroMessageSent events from ${network.name}`,
            );

            const parsedLogs = this.parser.parseLogs<MessageSentLogData>(
                logs,
                this.context.config.contract.router,
            );

            for (const parsedLog of parsedLogs) {
                const parsedReceipt = MessagingCodec.decodeReceipt(parsedLog.data.messageReceipt);
                const verifierType =
                    parsedLog.data.validatorLibs.length > 0 ? VerifierType.CRE : VerifierType.Empty;

                const shouldFinaliseSrc = parsedReceipt.srcChainData.blockConfirmations !== 0n;
                if (shouldFinaliseSrc) {
                    const confirmations = this.extractConfirmations(network.name, parsedReceipt);
                    await this.logFinalityService.addToStack({
                        verifierType,
                        chainName: network.name,
                        parsedReceipt,
                        parsedLog,
                        expectedBlockNumber: BigInt(confirmations) + parsedLog.blockNumber,
                    });
                } else {
                    this.requestVerification(parsedLog, parsedReceipt, verifierType).catch(
                        this.logger.error,
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }

    private extractConfirmations(
        networkName: string,
        parsedReceipt: DecodedMessageLogReceipt,
    ): number {
        if (parsedReceipt.srcChainData.blockConfirmations === maxUint64) {
            return this.context.deploymentManager.getFinalityConformationsByChainName(networkName);
        }

        return Number(parsedReceipt.srcChainData.blockConfirmations);
    }
}
