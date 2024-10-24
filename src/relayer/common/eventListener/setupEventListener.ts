import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { getFallbackClients } from "../../../utils/getViemClients";
import { conceroNetworks } from "../../../constants";
import logger from "../../../utils/logger";
import { pollLogs } from "./pollLogs";
import { type Abi, Address } from "viem";

export async function setupEventListener<T>(
    chainName: ConceroNetworkNames,
    contractAddress: Address,
    abi: Abi,
    onLogs: (chainName: ConceroNetworkNames, contractAddress: Address, logs: T[], abi: Abi) => void, // Callback for log processing
    pollingIntervalMs: number,
): Promise<void> {
    const { publicClient } = getFallbackClients(conceroNetworks[chainName]);
    let lastBlockNumber: bigint = await publicClient.getBlockNumber();

    logger.info(`[${chainName}] Monitoring contract: ${contractAddress} from block ${lastBlockNumber}`);

    //todo: look into this
    const poll = async () => {
        try {
            lastBlockNumber = await pollLogs(chainName, contractAddress, publicClient, lastBlockNumber, abi, onLogs);
        } catch (error) {
            logger.error(`[${chainName}] Error in polling loop for contract ${contractAddress}:`, error);
        } finally {
            setTimeout(poll, pollingIntervalMs); // Continue polling after a delay
        }
    };

    poll();
}
