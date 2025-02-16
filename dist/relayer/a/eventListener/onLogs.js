import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants/eventNames";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { relayCLFMessageReport } from "../contractCaller/relayCLFMessageReport";
export function onLogs(chainName, contractAddress, logs, abi) {
    var res = decodeLogs(chainName, contractAddress, logs, abi);
    if (res.decodedLogs) {
        res.decodedLogs.forEach(function(log) {
            switch(log.decodedLog.eventName){
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
