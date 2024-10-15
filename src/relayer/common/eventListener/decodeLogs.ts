// A generic function that processes logs using the provided ABI for decoding
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, AbiEventSignatureNotFoundError, Address, decodeEventLog } from "viem";
import logger from "../../../utils/logger";

export function decodeLogs(
    chainName: ConceroNetworkNames,
    contractAddress: Address,
    logs: any[],
    abi: Abi,
): { chainName: ConceroNetworkNames; contractAddress: Address; decodedLogs: any[] } {
    const decodedLogs: any[] = [];

    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi, // Use the passed ABI for decoding
                data: log.data,
                topics: log.topics,
                strict: true,
            });

            // console.log(`[${chainName}] Decoded ${decodedLog.eventName} event:`, decodedLog.args);
            decodedLogs.push({ chainName, contractAddress, decodedLog });
        } catch (error) {
            if (error instanceof AbiEventSignatureNotFoundError) {
                // Skip logs not found in ABI
                return;
            }
            logger.error(`[${chainName}] Error decoding log:`, error);
        }
    });

    return { chainName, contractAddress, decodedLogs };
}
