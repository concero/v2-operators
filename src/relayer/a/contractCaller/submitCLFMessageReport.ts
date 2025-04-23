import { AbiEvent, decodeEventLog, getAbiItem } from "viem";
import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import {
    callContract,
    decodeCLFReport,
    decodeMessageReportResult,
    logger,
} from "../../common/utils";
import { eventNames } from "../constants";
import { deploymentsManager } from "../../common/managers/DeploymentManager";
import { networkManager } from "../../common/managers/NetworkManager";
import { viemClientManager } from "../../common/managers/ViemClientManager";

export async function submitCLFMessageReport(log: DecodedLog) {
    const { transactionHash } = log;

    // 1. fetch & decode full CLF message report
    const { publicClient: verifierPublicClient } = viemClientManager.getClients(
        networkManager.getVerifierNetwork(),
    );

    const messageReportTx = await verifierPublicClient.getTransaction({ hash: transactionHash });
    const decodedCLFReport = decodeCLFReport(messageReportTx);
    const decodedMessageResult = decodeMessageReportResult(decodedCLFReport.report.results[0]);
    const { srcChainSelector, dstChainSelector } = decodedMessageResult.decodedMessageConfig;
    const messageId = decodedMessageResult.messageId;

    // 2. go to src chain and fetch original message bytes
    const srcChain = networkManager.getNetworkBySelector(srcChainSelector.toString());
    const { publicClient: srcPublicClient } = viemClientManager.getClients(srcChain);
    const [srcContractAddress] = await deploymentsManager.getRouterByChainName(srcChain.name);

    const currentBlock = await srcPublicClient.getBlockNumber();

    // Find the ConceroMessageSent event with our messageId
    const logs = await srcPublicClient.getLogs({
        address: srcContractAddress,
        event: getAbiItem({
            abi: globalConfig.ABI.CONCERO_ROUTER,
            name: eventNames.ConceroMessageSent,
        }) as AbiEvent,

        fromBlock: currentBlock - BigInt(100),
        toBlock: currentBlock,
    });

    const decodedLogs = [];
    logs.forEach(log => {
        try {
            const decodedLog = decodeEventLog({
                abi: globalConfig.ABI.CONCERO_ROUTER,
                data: log.data,
                topics: log.topics,
                strict: true,
            });

            decodedLogs.push({ ...log, ...decodedLog, chainName: srcChain.name });
        } catch (error) {
            console.error(`[${srcChain.name}] Error decoding log:`, error);
        }
    });

    // Find the ConceroMessageSent event
    const conceroMessageSentLog = decodedLogs.find(
        log =>
            log.eventName === eventNames.ConceroMessageSent &&
            log.args.messageId.toLowerCase() === messageId.toLowerCase(),
    );

    if (!conceroMessageSentLog) {
        throw new Error(`Could not find ConceroMessageSent event with messageId ${messageId}`);
    }

    // logger.info(`[${srcChain.name}] Found ConceroMessageSent event with messageId ${messageId}`);

    const { message } = conceroMessageSentLog.args;

    // 3. Send report + message to dst chain router
    const dstChain = networkManager.getNetworkBySelector(dstChainSelector.toString());

    const dstConceroRouter = await deploymentsManager.getRouterByChainName(dstChain.name);
    const { publicClient: dstPublicClient, walletClient: dstWalletClient } =
        viemClientManager.getClients(dstChain);

    const reportSubmission = {
        context: decodedCLFReport.reportContext,
        report: decodedCLFReport.reportBytes,
        rs: decodedCLFReport.rs,
        ss: decodedCLFReport.ss,
        rawVs: decodedCLFReport.rawVs,
    };

    const hash = await callContract(dstPublicClient, dstWalletClient, {
        chain: dstChain.viemChain,
        address: dstConceroRouter,
        abi: globalConfig.ABI.CONCERO_ROUTER,
        functionName: "submitMessageReport",
        args: [reportSubmission, message],
        account: dstWalletClient.account,
    });

    logger.info(`[${dstChain.name}] CLF message report submitted with hash: ${hash}`);
}
//
// async function test() {
//     const { publicClient } = viemClientManager.getClients(conceroNetworks["base"]);
//     const tx = await publicClient.getTransaction({
//         hash: "0x3018db9bf3525621578311b8ee09b5f735bc68dfbfd2142154b671ece68691a1",
//     });
//
//     const decodedCLFReport = decodeCLFReport(tx);
//
//     console.log(decodedCLFReport);
// }
// test();
