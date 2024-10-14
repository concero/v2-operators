import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi } from "viem";

export async function pollLogs<T>(
    chainName: ConceroNetworkNames,
    contractAddress: string,
    publicClient: any,
    lastBlockNumber: bigint,
    abi: Abi, // ABI passed for log decoding
    onLogs: (chainName: ConceroNetworkNames, logs: T[], abi: Abi) => Promise<void>, // Callback for log processing
): Promise<bigint> {
    const latestBlockNumber = await publicClient.getBlockNumber();

    if (latestBlockNumber > lastBlockNumber) {
        const logs = await publicClient.getLogs({
            address: contractAddress,
            fromBlock: lastBlockNumber + 1n,
            toBlock: latestBlockNumber,
        });

        // Call the provided log processing function and pass the ABI
        await onLogs(chainName, logs, abi);
        return latestBlockNumber;
    }
    return lastBlockNumber; // No new blocks, return the old block number
}
