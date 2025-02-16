// A generic function that processes logs using the provided ABI for decoding
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
import { AbiEventSignatureNotFoundError, decodeEventLog } from "viem";
import logger from "../../../utils/logger";
export function decodeLogs(chainName, contractAddress, logs, abi) {
    var decodedLogs = [];
    logs.forEach(function(log) {
        try {
            var decodedLog = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true
            });
            // console.log(`[${chainName}] Decoded ${decodedLog.eventName} event:`, decodedLog.args);
            decodedLogs.push({
                chainName: chainName,
                contractAddress: contractAddress,
                decodedLog: decodedLog
            });
        } catch (error) {
            if (_instanceof(error, AbiEventSignatureNotFoundError)) {
                // Skip logs not found in ABI
                return;
            }
            logger.error("[".concat(chainName, "] Error decoding log:"), error);
        }
    });
    return {
        chainName: chainName,
        contractAddress: contractAddress,
        decodedLogs: decodedLogs
    };
}
