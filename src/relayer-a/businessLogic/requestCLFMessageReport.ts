import { encodeAbiParameters, keccak256 } from "viem";

import { DeploymentManager } from "../../common/managers/DeploymentManager";
import { NetworkManager } from "../../common/managers/NetworkManager";
import { TxManager } from "../../common/managers/TxManager";
import { ViemClientManager } from "../../common/managers/ViemClientManager";
import { logger } from "../../common/utils";

import { globalConfig } from "../../constants";
import { DecodedLog } from "../../types/DecodedLog";
import { config } from "../constants";

export async function requestCLFMessageReport(log: DecodedLog, srcChainSelector: string) {
    const network = NetworkManager.getInstance().getVerifierNetwork();
    const { publicClient, walletClient } = ViemClientManager.getInstance().getClients(network);

    const { messageId, message } = log.args;

    const { publicClient: srcPublicClient } = ViemClientManager.getInstance().getClients(
        NetworkManager.getInstance().getNetworkBySelector(srcChainSelector),
    );

    const routerTx = await srcPublicClient.getTransaction({ hash: log.transactionHash });

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
                blockNumber: log.blockNumber,
                sender: routerTx.from,
            },
        ],
    );

    try {
        const verifierAddress = await DeploymentManager.getInstance().getConceroVerifier();

        if (globalConfig.TX_MANAGER.DRY_RUN) {
            const dryRunTxHash = `dry-run-${Date.now()}`;
            logger.info(
                `[DRY_RUN][${network.name}] CLF message report requested with hash: ${dryRunTxHash}`,
            );
            config.eventEmitter.emit("requestMessageReport", { txHash: dryRunTxHash });
            return;
        }

        const managedTx = await TxManager.getInstance().callContract({
            contractAddress: verifierAddress,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: "requestMessageReport",
            args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
            chain: network,
            messageId: messageId,
            options: {
                receiptConfirmations: 3,
                receiptTimeout: 60_000,
            },
        });

        const latestAttempt = managedTx.attempts[managedTx.attempts.length - 1];
        if (latestAttempt && latestAttempt.txHash) {
            config.eventEmitter.emit("requestMessageReport", { txHash: latestAttempt.txHash });
            logger.info(
                `[${network.name}] CLF message report requested with hash: ${latestAttempt.txHash}`,
            );
        } else {
            logger.error(
                `[${network.name}] Failed to submit CLF message report request transaction`,
            );
        }
    } catch (error) {
        // TODO: move this error handling to global error handler!
        logger.error(`[${network.name}] Error requesting CLF message report:`, error);
    }
}
