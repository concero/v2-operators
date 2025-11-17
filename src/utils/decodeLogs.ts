import { Abi, AbiEventSignatureNotFoundError, decodeEventLog, Log } from 'viem';

import { DecodedLog } from '../types';

export function decodeLogs(logs: Log[], abi: Abi): DecodedLog[] {
    const decodedLogs: DecodedLog[] = [];

    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true,
            });
            // @todo: fix decodeLogs type
            decodedLogs.push({ ...log, ...decodedLog } as unknown as DecodedLog);
        } catch (error) {
            if (error instanceof AbiEventSignatureNotFoundError) {
                return; // Skip logs outside of ABI
            } else {
                console.error(`[decodeLogs] : ${error}`);
            }
        }
    });

    return decodedLogs;
}
