import { encodeAbiParameters, keccak256 } from "viem";
import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import {
    callContract,
    decodeInternalMessageConfig,
    getChainBySelector,
    getEnvAddress,
    getFallbackClients,
    logger,
} from "../../common/utils";
import { config } from "../constants/";

export async function requestCLFMessageReport(log: DecodedLog) {
    const network = config.networks.conceroVerifier;
    const { publicClient, walletClient } = await getFallbackClients(network);

    const { messageId, internalMessageConfig, message } = log.args;
    const { srcChainSelector } = decodeInternalMessageConfig(internalMessageConfig);

    const { publicClient: srcPublicClient } = await getFallbackClients(
        getChainBySelector(srcChainSelector.toString()),
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
        const [verifierAddress] = getEnvAddress("verifier", network.name);

        const txHash = await callContract(publicClient, walletClient, {
            chain: network.viemChain,
            address: verifierAddress,
            account: walletClient.account,
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            functionName: "requestMessageReport",
            args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
        });

        config.eventEmitter.emit("requestMessageReport", { txHash });
        logger.info(`[${network.name}] CLF message report requested with hash: ${txHash}`);
    } catch (error) {
        logger.error(`[${network.name}] Error requesting CLF message report:`, error);
    }
}
