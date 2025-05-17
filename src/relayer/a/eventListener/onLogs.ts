import { Log } from "viem";
import { globalConfig } from "../../../constants";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { eventNames } from "../constants";
import { requestCLFMessageReport } from "../contractCaller/requestCLFMessageReport";
import { submitCLFMessageReport } from "../contractCaller/submitCLFMessageReport";

export async function onRouterLogs(logs: Log[], network: ConceroNetwork) {
    const decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_ROUTER);
    const promises = [];

    for (const log of decodedLogs) {
        if (log.eventName === eventNames.ConceroMessageSent) {
            promises.push(requestCLFMessageReport(log, network.chainSelector));
        }
    }

    if (promises.length) {
        await Promise.all(promises);
    }
}

export async function onVerifierLogs(logs: Log[], network: ConceroNetwork) {
    const decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_VERIFIER);
    const promises = [];

    for (const log of decodedLogs) {
        if (log.eventName === eventNames.MessageReport) {
            promises.push(submitCLFMessageReport(log));
        }
    }

    if (promises.length) {
        await Promise.all(promises);
    }
}
