import { getAbiItem, Log } from "viem";
import { globalConfig } from "../../../constants";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { submitCLFMessageReport } from "../contractCaller/submitCLFMessageReport";
import {ConceroNetwork} from "../../../types/ConceroNetwork";

const logsAbi = {
    conceroRouter: [
        getAbiItem({
            abi: globalConfig.ABI.CONCERO_ROUTER,
            name: eventNames.ConceroMessageSent,
        }),
    ],
    conceroVerifier: [
        getAbiItem({
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            name: eventNames.CLFMessageReport,
        }),
    ],
};

export async function onRouterLogs(logs: Log[], network: ConceroNetwork) {
    const decodedLogs = decodeLogs(logs, logsAbi.conceroRouter);

    for (const log of decodedLogs) {
        if (log.eventName === eventNames.ConceroMessageSent) {
            await requestCLFMessageReport(log);
        }
    }
}

export async function onVerifierLogs(logs: Log[], network: ConceroNetwork) {
    const decodedLogs = decodeLogs(logs, logsAbi.conceroVerifier);

    for (const log of decodedLogs) {
        if (log.eventName === eventNames.CLFMessageReport) {
            await submitCLFMessageReport(log);
        }
    }
}
