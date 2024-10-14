import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { getFallbackClients } from "../../../utils/getViemClients";
import { conceroNetworks } from "../../../constants";
import logger from "../../../utils/logger";
import { pollLogs } from "./pollLogs";
import { type Abi } from "viem";

export async function setupEventListener<T>(
    chainName: ConceroNetworkNames,
    contractAddress: string,
    abi: {
        inputs: (
            | { indexed: boolean; name: string; type: string }
            | { indexed: boolean; name: string; type: string }
            | {
                  indexed: boolean;
                  name: string;
                  type: string;
              }
            | { indexed: boolean; name: string; type: string }
            | { indexed: boolean; name: string; type: string }
            | {
                  indexed: boolean;
                  name: string;
                  type: string;
              }
        )[];
        name: string;
        type: string;
    }[], // ABI passed for decoding logs
    onLogs: (chainName: ConceroNetworkNames, logs: T[], abi: Abi) => Promise<void>, // Callback for log processing
    pollingIntervalMs: number,
): Promise<void> {
    const { publicClient } = getFallbackClients(conceroNetworks[chainName]);
    let lastBlockNumber: bigint = await publicClient.getBlockNumber();

    logger.info(`[${chainName}] Monitoring contract: ${contractAddress} from block ${lastBlockNumber}`);

    const poll = async () => {
        try {
            lastBlockNumber = await pollLogs(chainName, contractAddress, publicClient, lastBlockNumber, abi, onLogs);
        } catch (error) {
            logger.error(`[${chainName}] Error in polling loop for contract ${contractAddress}:`, error);
        } finally {
            setTimeout(poll, pollingIntervalMs); // Continue polling after a delay
        }
    };

    poll(); // Start the polling loop
}
