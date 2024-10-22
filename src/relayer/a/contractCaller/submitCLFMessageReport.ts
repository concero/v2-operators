import { DecodedLog } from "../../../types/DecodedLog";
import { conceroNetworks } from "../../../constants";
import { getFallbackClients } from "../../../utils/getViemClients";
import { decodeCLFReport, decodeCLFReportResult } from "../../../utils/decodeCLFReport";
import { getChainBySelector } from "../../../utils/getChainBySelector";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { decodeEventLog } from "viem";
import { eventNames } from "../constants/eventNames";
import { callContract } from "../../common/contractCaller/callContract";
import logger from "../../../utils/logger";

export async function submitCLFMessageReport(log: DecodedLog) {
    const { abi: conceroRouterAbi } = await import("../constants/ConceroRouter.json");

    //todo:
    // get srcBlockNumber and ConceroMessageId from CLFMessageReport log
    // fetch message from SRC
    // (optional) verify that message data hash matches the hash in the CLFMessageReport
    // send CLF report with message data to DST ConceroRouter

    const { chainName, address, transactionHash, decodedLog } = log;

    const { conceroId } = decodedLog.args;

    const { publicClient: clfPublicClient } = getFallbackClients(conceroNetworks[chainName]);
    const tx = await clfPublicClient.getTransaction({ hash: transactionHash });

    // console.log(tx);
    // console.log(`Submitting CLF message report for message ID: ${conceroId}`);

    const decodedCLFReport = decodeCLFReport(tx);
    const decodedCLFResult = decodeCLFReportResult(decodedCLFReport.report.results);

    // console.log(decodedCLFResult);
    // console.log(decodedCLFResult);
    // 1. go to src chain and fetch message
    const srcChain = getChainBySelector(decodedCLFResult.srcChainSelector);
    const { publicClient: srcPublicClient } = getFallbackClients(srcChain);
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
                abi: conceroRouterAbi, // Use the passed ABI for decoding
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
    // 2. get dst chain from message and post report + message to dst chain
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
        abi: conceroRouterAbi,
        functionName: "submitMessageReport",
        args: [reportSubmission, message],
    });

    console.log(hash);
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
