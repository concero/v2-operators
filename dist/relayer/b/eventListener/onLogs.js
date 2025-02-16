import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants/eventNames";
import { relayCLFMessageReport } from "../../a/contractCaller/relayCLFMessageReport";
export function onLogs(chainName, contractAddress, logs, abi) {
    var res = decodeLogs(chainName, contractAddress, logs, abi);
    if (res.decodedLogs) {
        res.decodedLogs.forEach(function(log) {
            switch(log.decodedLog.eventName){
                case eventNames.RequestFulfilled:
                    relayCLFMessageReport(log);
                    break;
                // case eventNames.RequestFulfilled:
                //     relayDONReport(log);
                //     break;
                default:
                    break;
            }
        });
    }
}
