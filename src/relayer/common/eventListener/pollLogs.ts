import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, Address } from "viem";

export async function pollLogs<T>(
    chainName: ConceroNetworkNames,
    contractAddress: Address,
    publicClient: any,
    lastBlockNumber: bigint,
    abi: Abi, // ABI passed for log decoding
    onLogs: (chainName: ConceroNetworkNames, contractAddress: Address, logs: T[], abi: Abi) => void, // Callback for log processing
): Promise<bigint> {
    const latestBlockNumber = await publicClient.getBlockNumber();

    if (latestBlockNumber > lastBlockNumber) {
        //todo: only if logs not null, invoke onlogs
        const logs = await publicClient.getLogs({
            address: contractAddress,
            // fromBlock: 21072979n,
            // toBlock: 21072980n,
            fromBlock: lastBlockNumber + 1n,
            toBlock: latestBlockNumber,
        });

        if (logs.length > 0) {
            // logger.info(`[${chainName}] Received ${logs.length} logs for contract: ${contractAddress}`);
            onLogs(chainName, contractAddress, logs, abi);
        }
        return latestBlockNumber;
    }
    return lastBlockNumber;
}
