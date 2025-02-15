import { decodeEventLog } from "viem";
import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import {
    callContract,
    decodeCLFReport,
    decodeCLFReportResult,
    getChainBySelector,
    getEnvAddress,
    getFallbackClients,
    logger,
} from "../../common/utils";
import { config, eventNames } from "../constants";

export async function submitCLFMessageReport(log: DecodedLog) {
    const { address, transactionHash, args } = log;
    const { conceroId } = args;

    // 1. fetch & decode full CLF message report
    const { publicClient: verifierPublicClient } = await getFallbackClients(
        config.networks.conceroVerifier,
    );
    const messageReportTx = await verifierPublicClient.getTransaction({ hash: transactionHash });

    const decodedCLFReport = decodeCLFReport(messageReportTx);
    const decodedCLFResult = decodeCLFReportResult(decodedCLFReport.report.results);

    // 2. go to src chain and fetch original message bytes
    const srcChain = getChainBySelector(decodedCLFResult.srcChainSelector);
    const { publicClient: srcPublicClient } = await getFallbackClients(srcChain);
    const [srcContractAddress] = getEnvAddress("routerProxy", srcChain.name);

    const logs = await srcPublicClient.getLogs({
        address: srcContractAddress,
        topics: [null, decodedCLFResult.messageId],
        fromBlock: BigInt(decodedCLFResult.srcBlockNumber),
        toBlock: BigInt(decodedCLFResult.srcBlockNumber),
    });

    const decodedLogs = [];
    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi: globalConfig.ABI.CONCERO_ROUTER,
                data: log.data,
                topics: log.topics,
                strict: false,
            });

            // console.log(`[${chainName}] Decoded ${decodedLog.eventName} event:`, decodedLog.args);
            decodedLogs.push({ ...log, decodedLog, chainName });
        } catch (error) {
            console.error(`[${chainName}] Error decoding log:`, error);
        }
    });

    const [conceroMessageSentLog] = decodedLogs.filter(
        log => log.decodedLog.eventName === eventNames.ConceroMessageSent,
    );

    const { message } = conceroMessageSentLog.decodedLog.args;

    // 3. Send report + message to dst chain router
    const dstChain = getChainBySelector(message.dstChainSelector.toString());

    const [dstConceroRouter] = getEnvAddress("routerProxy", dstChain.name);
    const { publicClient: dstPublicClient } = getFallbackClients(dstChain);

    //encodes object into bytes

    const reportSubmission = {
        context: decodedCLFReport.reportContext,
        report: decodedCLFReport.reportBytes,
        rs: decodedCLFReport.rs,
        ss: decodedCLFReport.ss,
        rawVs: decodedCLFReport.rawVs,
    };

    const hash = await callContract({
        chain: dstChain,
        address: dstConceroRouter,
        abi: globalConfig.ABI.CONCERO_ROUTER,
        functionName: "submitMessageReport",
        args: [reportSubmission, message],
    });

    logger.info(`[${chainName}] CLF message report submitted with hash: ${hash}`);
}
//
// async function test() {
//     const { publicClient } = getFallbackClients(conceroNetworks["base"]);
//     const tx = await publicClient.getTransaction({
//         hash: "0x3018db9bf3525621578311b8ee09b5f735bc68dfbfd2142154b671ece68691a1",
//     });
//
//     const decodedCLFReport = decodeCLFReport(tx);
//
//     console.log(decodedCLFReport);
// }
// test();
