import { Log, PublicClient, WalletClient, encodeAbiParameters, keccak256 } from "viem";

import { Logger, NetworkManager, ViemClientManager } from "@concero/operator-utils";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { MessagingDeploymentManager, TxWriter } from "../../common/managers";

import { eventEmitter, globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { DecodedLog } from "../../types/DecodedLog";

export async function requestCLFMessageReport(logs: Log[], network: ConceroNetwork) {
    if (logs.length === 0) return;

    const logger = Logger.getInstance().getLogger("requestCLFMessageReport");
    logger.debug(
        `Processing ${logs.length} logs for CLF message report requests from ${network.name}`,
    );

    const networkManager = NetworkManager.getInstance();
    const verifierNetwork = networkManager.getVerifierNetwork();
    const verifierAddress = await MessagingDeploymentManager.getInstance().getConceroVerifier();
    const { publicClient, walletClient } =
        ViemClientManager.getInstance().getClients(verifierNetwork);

    // Decode logs to access event data
    try {
        const decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_ROUTER);
        const promises = [];

        for (const decodedLog of decodedLogs) {
            promises.push(
                processMessageReportRequest(
                    decodedLog,
                    network.chainSelector,
                    logger,
                    networkManager,
                    verifierNetwork,
                    verifierAddress,
                    publicClient,
                    walletClient,
                ),
            );
        }

        await Promise.all(promises);
    } catch (error) {
        logger.error(`Error processing logs from ${network.name}:`, error);
    }
}

async function processMessageReportRequest(
    decodedLog: DecodedLog,
    srcChainSelector: string,
    logger: ReturnType<typeof Logger.prototype.getLogger>,
    networkManager: ReturnType<typeof NetworkManager.getInstance>,
    verifierNetwork: ConceroNetwork,
    verifierAddress: string,
    publicClient: PublicClient,
    walletClient: WalletClient,
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
                    type: "tuple",
                    components: [
                        { name: "blockNumber", type: "uint256" },
                        { name: "sender", type: "address" },
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
            eventEmitter.emit("requestMessageReport", { txHash: dryRunTxHash });
            return;
        }

        const txHash = await TxWriter.getInstance().callContract(
            walletClient,
            publicClient,
            verifierNetwork,
            {
                address: verifierAddress,
                abi: globalConfig.ABI.CONCERO_VERIFIER,
                functionName: "requestMessageReport",
                args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
                chain: verifierNetwork.viemChain,
                options: {
                    receiptConfirmations: 3,
                    receiptTimeout: 60_000,
                },
            },
        );

        if (txHash) {
            eventEmitter.emit("requestMessageReport", {
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
            `[${verifierNetwork.name}] Error requesting CLF message report for messageId ${decodedLog.args?.messageId || "unknown"}:`,
            error,
        );

        // Emit error event for monitoring
        eventEmitter.emit("requestMessageReportError", {
            messageId: decodedLog.args?.messageId,
            error: error.message,
            chainName: verifierNetwork.name,
        });
    }
}
