import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, Address } from "viem";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants/eventNames";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { submitCLFMessageReport } from "../contractCaller/submitCLFMessageReport";

export async function onLogs(chainName: ConceroNetworkNames, contractAddress: Address, logs: any[], abi: Abi) {
    const res = decodeLogs(chainName, contractAddress, logs, abi);

    for (const log of res.decodedLogs) {
        console.log(`[${chainName}] Decoded log:`, log);
        switch (log.decodedLog.eventName) {
            case eventNames.ConceroMessageSent:
                await requestCLFMessageReport(log);
                break;

            case eventNames.RequestFulfilled:
                await submitCLFMessageReport(log);
                break;

            default:
                break;
        }
    }
}
