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
        const logs = await publicClient.getLogs({
            address: contractAddress,
            fromBlock: 21072979n,
            toBlock: 21072980n,
            // fromBlock: lastBlockNumber + 1n,
            // toBlock: latestBlockNumber,
        });

        onLogs(chainName, contractAddress, logs, abi);
        return latestBlockNumber;
    }
    return lastBlockNumber;
}
