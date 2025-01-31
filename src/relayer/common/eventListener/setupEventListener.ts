import { Address } from "viem";
import { conceroNetworks } from "../../../constants";
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { getFallbackClients, logger } from "../utils";
import { pollLogs } from "./pollLogs";

export async function setupEventListener<T>(
    chainName: ConceroNetworkNames,
    contractAddress: Address,
    onLogs: (chainName: ConceroNetworkNames, contractAddress: Address, logs: T[]) => void, // Callback for log processing
    pollingIntervalMs: number,
): Promise<void> {
    const { publicClient } = getFallbackClients(conceroNetworks[chainName]);
    let lastBlockNumber: bigint = await publicClient.getBlockNumber();

    logger.info(
        `[${chainName}] Monitoring contract: ${contractAddress} from block ${lastBlockNumber}`,
    );

    const poll = async () => {
        try {
            lastBlockNumber = await pollLogs(
                chainName,
                contractAddress,
                publicClient,
                lastBlockNumber,
                onLogs,
            );
        } catch (error) {
            logger.error(
                `[${chainName}] Error in polling loop for contract ${contractAddress}:`,
                error,
            );
        } finally {
            setTimeout(poll, pollingIntervalMs);
        }
    };

    poll();
}
