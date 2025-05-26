import { encodeAbiParameters, keccak256 } from "viem";

import {
    DeploymentManager,
    NetworkManager,
    TxManager,
    ViemClientManager,
} from "../../common/managers";
import { Logger, LoggerInterface } from "../../common/utils/logger";

import { globalConfig } from "../../constants";
import { eventEmitter } from "../../constants/eventEmitter";
import { DecodedLog } from "../../types/DecodedLog";

export async function requestCLFMessageReport(decodedLog: DecodedLog, srcChainSelector: string) {
    const network = NetworkManager.getInstance().getVerifierNetwork();
    const { publicClient, walletClient } = ViemClientManager.getInstance().getClients(network);

    const { messageId, message } = decodedLog.args;

    const { publicClient: srcPublicClient } = ViemClientManager.getInstance().getClients(
        NetworkManager.getInstance().getNetworkBySelector(srcChainSelector),
    );

    const routerTx = await srcPublicClient.getTransaction({ hash: decodedLog.transactionHash });

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
                sender: routerTx.from,
            },
        ],
    );

    try {
        const verifierAddress = await DeploymentManager.getInstance().getConceroVerifier();
        const logger = Logger.getInstance().getLogger("requestCLFMessageReport");

        if (globalConfig.TX_MANAGER.DRY_RUN) {
            const dryRunTxHash = `dry-run-${Date.now()}`;
            logger.info(
                `[DRY_RUN]:${network.name} CLF message report requested with hash: ${dryRunTxHash}`,
            );
            eventEmitter.emit("requestMessageReport", { txHash: dryRunTxHash });
            return;
        }

        const managedTx = await TxManager.getInstance().callContract(walletClient, publicClient, {
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

        if (managedTx && managedTx.txHash) {
            eventEmitter.emit("requestMessageReport", {
                txHash: managedTx.txHash,
            });
            logger.info(
                `${network.name} CLF message report requested with hash: ${managedTx.txHash}`,
            );
        } else {
            logger.error(`${network.name} Failed to submit CLF message report request transaction`);
        }
    } catch (error) {
        // TODO: move this error handling to global error handler!
        logger.error(`[${network.name}] Error requesting CLF message report:`, error);
    }
}
