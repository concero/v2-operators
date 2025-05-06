import { encodeAbiParameters, keccak256 } from "viem";
import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import { callContract, logger } from "../../common/utils";
import { config } from "../constants/";
import { networkManager } from "../../common/managers/NetworkManager";
import { viemClientManager } from "../../common/managers/ViemClientManager";
import { deploymentsManager } from "../../common/managers/DeploymentManager";

export async function requestCLFMessageReport(log: DecodedLog, srcChainSelector: string) {
    const network = networkManager.getVerifierNetwork();
    const { publicClient, walletClient } = viemClientManager.getClients(network);

    const { messageId, message } = log.args;

    const { publicClient: srcPublicClient } = viemClientManager.getClients(
        networkManager.getNetworkBySelector(srcChainSelector),
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
        const verifierAddress = await deploymentsManager.getConceroVerifier();

        const { transactionHash } = await callContract(publicClient, walletClient, {
            chain: network.viemChain,
            address: verifierAddress,
            account: walletClient.account,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: "requestMessageReport",
            args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
        });

        config.eventEmitter.emit("requestMessageReport", { txHash: transactionHash });
        logger.info(`[${network.name}] CLF message report requested with hash: ${transactionHash}`);
    } catch (error) {
        // TODO: move this error handling to global error handler!
        logger.error(`[${network.name}] Error requesting CLF message report:`, error);
    }
}
