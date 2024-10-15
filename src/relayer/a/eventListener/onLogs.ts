import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Abi, Address } from "viem";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants/eventNames";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { relayCLFMessageReport } from "../contractCaller/relayCLFMessageReport";

export function onLogs(chainName: ConceroNetworkNames, contractAddress: Address, logs: any[], abi: Abi) {
    const res = decodeLogs(chainName, contractAddress, logs, abi);

    if (res.decodedLogs) {
        res.decodedLogs.forEach(log => {
            switch (log.decodedLog.eventName) {
                case eventNames.CCIPSent:
                    requestCLFMessageReport(log);
                    break;

                case eventNames.RequestFulfilled:
                    relayCLFMessageReport(log);
                    break;

                default:
                    break;
            }
        });
    }
}
