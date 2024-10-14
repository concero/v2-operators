// A generic function that processes logs using the provided ABI for decoding
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, decodeEventLog } from "viem";
import logger from "../../../utils/logger";

export async function onLogs(chainName: ConceroNetworkNames, logs: any[], abi: Abi) {
    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi, // Use the passed ABI for decoding
                data: log.data,
                topics: log.topics,
            });
            logger.debug(`[${chainName}] Decoded ${decodedLog.eventName} event:`, JSON.stringify(decodedLog.args));
        } catch (error) {
            //ignore error
        }
    });
}
