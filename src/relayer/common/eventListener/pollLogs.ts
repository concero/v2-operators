import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Address } from "viem";

export async function pollLogs<T>(
    chainName: ConceroNetworkNames,
    contractAddress: Address,
    publicClient: any,
    lastBlockNumber: bigint,
    onLogs: (chainName: ConceroNetworkNames, contractAddress: Address, logs: T[]) => void, // Callback for log processing
): Promise<bigint> {
    const latestBlockNumber = await publicClient.getBlockNumber();

    if (latestBlockNumber > lastBlockNumber) {
        //todo: only if logs not null, invoke onlogs
        const logs = await publicClient.getLogs({
            address: contractAddress,
            // fromBlock: 16889999n,
            // toBlock: 16889999n,
            fromBlock: lastBlockNumber + 1n,
            toBlock: latestBlockNumber,
        });

        if (logs.length > 0) {
            // logger.info(`[${chainName}] Received ${logs.length} logs for contract: ${contractAddress}`);
            onLogs(chainName, contractAddress, logs);
        }
        return latestBlockNumber;
    }
    return lastBlockNumber;
}
