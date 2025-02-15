import { Log, type Address } from "viem";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { getFallbackClients, logger } from "../utils";

/** @notice Represents a handle for controlling an active event listener. */
export interface EventListenerHandle {
    stop: () => void;
}

/**
 * @param chainName The name of the chain to monitor.
 * @param contractAddress The address of the contract to monitor.
 * @param onLogs Callback to process fetched logs.
 * @param pollingIntervalMs The polling interval in milliseconds.
 * @returns {Promise<EventListenerHandle>} An object with a `stop` method to cancel polling.
 * @notice Sets up an event listener for contract logs and returns a handle for controlling it.
 */
export async function setupEventListener<T>(
    network: ConceroNetwork,
    contractAddress: Address,
    onLogs: (logs: Log[], network: ConceroNetwork) => void,
    pollingIntervalMs: number,
): Promise<EventListenerHandle> {
    const { publicClient } = await getFallbackClients(network);
    let lastBlockNumber: bigint = await publicClient.getBlockNumber();

    logger.info(
        `[${network.name}] Monitoring contract: ${contractAddress} from block ${lastBlockNumber}`,
    );

    let cancelled = false;
    let timerId: ReturnType<typeof setTimeout>;

    async function pollLogs() {
        if (cancelled) return;
        try {
            const { publicClient } = await getFallbackClients(network);
            const latestBlockNumber = await publicClient.getBlockNumber();
            if (latestBlockNumber > lastBlockNumber) {
                //todo: only if logs not null, invoke onlogs
                const logs = await publicClient.getLogs({
                    address: contractAddress,
                    fromBlock: lastBlockNumber + 1n,
                    toBlock: latestBlockNumber,
                });

                if (logs.length > 0) {
                    // logger.info(`[${chainName}] Received ${logs.length} logs for contract: ${contractAddress}`);
                    onLogs(logs, network);
                }
                lastBlockNumber = latestBlockNumber;
            }
        } catch (error) {
            logger.error(
                `[${network.name}] Error in polling loop for contract ${contractAddress}:`,
                error,
            );
        } finally {
            if (!cancelled) {
                timerId = setTimeout(pollLogs, pollingIntervalMs);
            }
        }
    }

    pollLogs();

    const stop = () => {
        cancelled = true;
        if (timerId) clearTimeout(timerId);
    };

    return { stop };
}
