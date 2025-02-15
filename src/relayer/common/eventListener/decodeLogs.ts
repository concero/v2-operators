// A generic function that processes logs using the provided ABI for decoding
import { Abi, AbiEventSignatureNotFoundError, decodeEventLog, Log } from "viem";
import { AppErrorEnum } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import { AppError } from "../utils";

export function decodeLogs(logs: Log[], abi: Abi): DecodedLog[] {
    const decodedLogs: any[] = [];

    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi,
                data: log.data,
                topics: log.topics,
                strict: false,
            });

            decodedLogs.push({ ...log, ...decodedLog });
        } catch (error) {
            if (error instanceof AbiEventSignatureNotFoundError) return; // Skip logs outside of ABI
            throw new AppError(AppErrorEnum.LogDecodingFailed, error);
        }
    });

    return decodedLogs;
}
