// A generic function that processes logs using the provided ABI for decoding
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, AbiEventSignatureNotFoundError, decodeEventLog } from "viem";
import logger from "../../../utils/logger";

export async function onLogs(chainName: ConceroNetworkNames, logs: any[], abi: Abi) {
    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi, // Use the passed ABI for decoding
                data: log.data,
                topics: log.topics,
                strict: true,
            });
            console.log(`[${chainName}] Decoded ${decodedLog.eventName} event:`, decodedLog.args);
        } catch (error) {
            if (error instanceof AbiEventSignatureNotFoundError) {
                // logger.warn(`[${chainName}] Event not found in ABI`);
                return;
            }
            logger.error(`[${chainName}] Error decoding log:`, error);
        }
    });
}
