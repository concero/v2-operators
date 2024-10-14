import { conceroNetworks, envPrefixes, networkEnvKeys } from "../constants";
import { getFallbackClients } from "../utils/getViemClients";
import { decodeEventLog } from "viem";
import conceroInfraAbi from "../abi/conceroInfraAbi";

import { getEnvAddress, getEnvVar } from "../utils/getEnvVar";
import logger from "../utils/logger";
const POLLING_INTERVAL_MS = 5000;

type NetworkName = "arbitrum" | "base" | "polygon" | "avalanche";

async function processLogs(chainName: NetworkName, logs: any[], contractAddress: string) {
    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi: conceroInfraAbi,
                data: log.data,
                topics: log.topics,
            });
            logger.info(`[${chainName}] Decoded ${decodedLog.eventName} event:`, decodedLog.args);
        } catch (error) {
            // logger.error(`[${chainName}] Error decoding log from contract ${contractAddress}:`, error);
        }
    });
}

async function pollLogs(chainName: NetworkName, contractAddress: string, publicClient: any, lastBlockNumber: bigint) {
    const latestBlockNumber = await publicClient.getBlockNumber();

    if (latestBlockNumber > lastBlockNumber) {
        const logs = await publicClient.getLogs({
            address: contractAddress,
            fromBlock: lastBlockNumber + 1n,
            toBlock: latestBlockNumber,
        });

        await processLogs(chainName, logs, contractAddress);
        return latestBlockNumber;
    }
    return lastBlockNumber; // No new blocks, return the old block number
}
async function setupEventListener(chainName: NetworkName, contractAddress: string) {
    const { publicClient } = getFallbackClients(conceroNetworks[chainName]);

    let lastBlockNumber: bigint = await publicClient.getBlockNumber();

    logger.info(`[${chainName}] Monitoring contract: ${contractAddress} from block ${lastBlockNumber}`);

    const poll = async () => {
        try {
            lastBlockNumber = await pollLogs(chainName, contractAddress, publicClient, lastBlockNumber);
        } catch (error) {
            logger.error(`[${chainName}] Error in polling loop for contract ${contractAddress}:`, error);
        } finally {
            // Set up the next poll after POLLING_INTERVAL
            setTimeout(poll, POLLING_INTERVAL_MS);
        }
    };

    // Start the polling loop
    poll();
}

// Function to set up event listeners for all contracts on all chains
export async function setupEventListeners() {
    // Define multiple contracts for each chain (if needed)
    const contractAddresses: Record<NetworkName, string> = {
        arbitrum: getEnvAddress("infraProxy", conceroNetworks.arbitrum.name)[0],
        base: getEnvAddress("infraProxy", conceroNetworks.base.name)[0],
        polygon: getEnvAddress("infraProxy", conceroNetworks.polygon.name)[0],
        avalanche: getEnvAddress("infraProxy", conceroNetworks.avalanche.name)[0],
    };

    for (const chainName in contractAddresses) {
        await setupEventListener(chainName, contractAddresses[chainName]);
    }
}
