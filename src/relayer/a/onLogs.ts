import { ConceroNetworkNames } from "../../types/ConceroNetwork";
import { Abi, Address } from "viem";
import { decodeLogs } from "../common/eventListener/decodeLogs";
import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";

export function relayEvent(log: {
    chainName: ConceroNetworkNames;
    contractAddress: Address;
    decodedLog: DecodeEventLogReturnType;
}) {
    console.log("Relaying event:", log.decodedLog.eventName);
}

export function onLogs(chainName: ConceroNetworkNames, contractAddress: Address, logs: any[], abi: Abi) {
    const res = decodeLogs(chainName, contractAddress, logs, abi);

    if (res.decodedLogs) {
        res.decodedLogs.forEach(relayEvent);
    }
}
