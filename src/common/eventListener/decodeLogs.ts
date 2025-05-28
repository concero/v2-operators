import { Abi, AbiEventSignatureNotFoundError, Log, decodeEventLog } from "viem";

import { DecodedLog } from "../../types/DecodedLog";

export function decodeLogs(logs: Log[], abi: Abi): DecodedLog[] {
    const decodedLogs: any[] = [];

    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true,
            });

            decodedLogs.push({ ...log, ...decodedLog });
        } catch (error) {
            if (error instanceof AbiEventSignatureNotFoundError) {
                return; // Skip logs outside of ABI
            } else {
                throw error;
            }
        }
    });

    return decodedLogs;
}
