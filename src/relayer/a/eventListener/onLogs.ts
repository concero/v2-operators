import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { Address } from "viem";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants/eventNames";
import { abi as verifierAbi } from "../../../abi/Verifier.json";
import { abi as routerAbi } from "../../../abi/ConceroRouter.json";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { submitCLFMessageReport } from "../contractCaller/submitCLFMessageReport";

// filters abi to only pick ConceroMessageSent event
// const routerEventsAbi = getAbiItem({ abi: routerAbi, name: eventNames.ConceroMessageSent });
// const VerifierEventsAbi = getAbiItem({ abi: verifierAbi, name: eventNames.CLFMessageReport });

export async function onRouterLogs(chainName: ConceroNetworkNames, contractAddress: Address, logs: any[]) {
    const res = decodeLogs(chainName, contractAddress, logs, routerAbi);
    for (const log of res.decodedLogs) {
        if (log.decodedLog.eventName === eventNames.ConceroMessageSent) {
            await requestCLFMessageReport(log);
        }
    }
}

export async function onVerifierLogs(chainName: ConceroNetworkNames, contractAddress: Address, logs: any[]) {
    const res = decodeLogs(chainName, contractAddress, logs, verifierAbi);
    for (const log of res.decodedLogs) {
        if (log.decodedLog.eventName === eventNames.CLFMessageReport) {
            await submitCLFMessageReport(log);
        }
    }
}
