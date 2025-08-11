import {
    Logger,
    LoggerInterface,
    NetworkManager,
    TxMonitor,
    TxWriter,
} from '@concero/operator-utils';
import { Log, encodeAbiParameters, keccak256 } from 'viem';

import { decodeLogs } from '../../common/eventListener/decodeLogs';
import { MessagingDeploymentManager } from '../../common/managers';
import { eventEmitter, globalConfig } from '../../constants';
import { ConceroNetwork } from '../../types/ConceroNetwork';
import { DecodedLog } from '../../types/DecodedLog';
import { FinalityContext, FinalityHandler, FinalityService } from '../services/FinalityService';

interface MessageReportContext {
    decodedLog: DecodedLog;
    chainSelector: string;
    verifierNetwork: ConceroNetwork;
    verifierAddress: string;
    logger: LoggerInterface;
}

function createMessageReportFinalityHandler(
    networkName: string,
    logger: LoggerInterface,
): FinalityHandler<MessageReportContext> {
    return {
        async onFinalized(context: FinalityContext<MessageReportContext>): Promise<void> {
            const { decodedLog, chainSelector, verifierNetwork, verifierAddress, logger } =
                context.data;

            logger.debug(
                `Transaction ${decodedLog.transactionHash} finalized, processing message report request`,
            );

            try {
                await processMessageReportRequest(
                    decodedLog,
                    chainSelector,
                    logger,
                    verifierNetwork,
                    verifierAddress,
                );
            } catch (error) {
                logger.error(
                    `Failed to process message report for tx ${decodedLog.transactionHash}:`,
                    error,
                );
            }
        },

        async onFailed(context: FinalityContext<MessageReportContext>): Promise<void> {
            const { decodedLog } = context.data;
            logger.error(
                `Transaction ${decodedLog.transactionHash} failed to reach finality on ${networkName}`,
            );
        },
    };
}

export async function requestCLFMessageReport(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    const logger = Logger.getInstance().getLogger('requestCLFMessageReport');
    logger.debug(
        `Processing ${logs.length} logs for CLF message report requests from ${network.name}`,
    );

    const networkManager = NetworkManager.getInstance();
    const verifierNetwork = networkManager.getVerifierNetwork();
    const verifierAddress = await MessagingDeploymentManager.getInstance().getConceroVerifier();

    // Decode logs to access event data
    try {
        const decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_ROUTER);

        // Split logs into two groups by shouldFinaliseSrc flag
        const immediateProcessLogs = decodedLogs.filter(
            log => !(log.args as any)?.shouldFinaliseSrc,
        );
        const finalityRequiredLogs = decodedLogs.filter(
            log => (log.args as any)?.shouldFinaliseSrc,
        );

        logger.debug(
            `Split logs: ${immediateProcessLogs.length} immediate, ${finalityRequiredLogs.length} requiring finality`,
        );

        // Process logs without finality requirement immediately
        const immediatePromises = immediateProcessLogs.map(decodedLog =>
            processMessageReportRequest(
                decodedLog,
                network.chainSelector,
                logger,
                verifierNetwork,
                verifierAddress,
            ),
        );

        // For logs with finality requirement, use FinalityService
        let finalityService: FinalityService;
        try {
            finalityService = FinalityService.getInstance();
        } catch {
            const finalityLogger = Logger.getInstance().getLogger('FinalityService');
            const txMonitor = TxMonitor.getInstance();
            return FinalityService.createInstance(finalityLogger, txMonitor);
        }

        const messageReportHandler = createMessageReportFinalityHandler(network.name, logger);

        finalityRequiredLogs.forEach(decodedLog => {
            const context: MessageReportContext = {
                decodedLog,
                chainSelector: network.chainSelector,
                verifierNetwork,
                verifierAddress,
                logger,
            };

            finalityService.addTransaction(
                decodedLog.transactionHash!,
                network.name,
                BigInt(decodedLog.blockNumber!),
                { data: context, metadata: { network: network.name } },
                messageReportHandler,
            );
        });

        // Wait for immediate processing to complete, finality checks run asynchronously
        await Promise.all(immediatePromises);

        logger.debug(`Started ${finalityRequiredLogs.length} finality checks for ${network.name}`);
    } catch (error) {
        logger.error(`Error processing logs from ${network.name}:`, error);
    }
}

async function processMessageReportRequest(
    decodedLog: DecodedLog,
    srcChainSelector: string,
    logger: LoggerInterface,
    verifierNetwork: ConceroNetwork,
    verifierAddress: string,
) {
    try {
        const { messageId, message, sender } = decodedLog.args;

        if (!messageId || !message || !sender) {
            logger.warn(`Missing required data in log: ${JSON.stringify(decodedLog)}`);
            return;
        }

        const encodedSrcChainData = encodeAbiParameters(
            [
                {
                    type: 'tuple',
                    components: [
                        { name: 'blockNumber', type: 'uint256' },
                        { name: 'sender', type: 'address' },
                    ],
                },
            ],
            [
                {
                    blockNumber: decodedLog.blockNumber,
                    sender,
                },
            ],
        );

        if (globalConfig.TX_MANAGER.DRY_RUN) {
            const dryRunTxHash = `dry-run-${Date.now()}-${messageId}`;
            logger.info(
                `[DRY_RUN]:${verifierNetwork.name} CLF message report requested with hash: ${dryRunTxHash}`,
            );
            eventEmitter.emit('requestMessageReport', { txHash: dryRunTxHash });
            return;
        }

        const txHash = await TxWriter.getInstance().callContract(verifierNetwork, {
            address: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: 'requestMessageReport',
            args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
            chain: verifierNetwork.viemChain,
            options: {
                receiptConfirmations: 3,
                receiptTimeout: 60_000,
            },
        });

        if (txHash) {
            eventEmitter.emit('requestMessageReport', {
                txHash: txHash,
            });
            logger.info(
                `${verifierNetwork.name} CLF message report requested with hash: ${txHash}`,
            );
        } else {
            logger.error(
                `${verifierNetwork.name} Failed to submit CLF message report request transaction`,
            );
        }
    } catch (error) {
        // TODO: move this error handling to global error handler!
        logger.error(
            `[${verifierNetwork.name}] Error requesting CLF message report for messageId ${decodedLog.args?.messageId || 'unknown'}:`,
            error,
        );

        // Emit error event for monitoring
        eventEmitter.emit('requestMessageReportError', {
            messageId: decodedLog.args?.messageId,
            error: error.message,
            chainName: verifierNetwork.name,
        });
    }
}
