import { AbiEvent, decodeEventLog, getAbiItem } from "viem";
import { globalConfig } from "../../../constants";
import { DecodedLog } from "../../../types/DecodedLog";
import {
    callContract,
    decodeCLFReport,
    decodeMessageReportResult,
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

    // console.log('messageReportTx');
    // console.log(messageReportTx);
    const decodedCLFReport = decodeCLFReport(messageReportTx);

    // console.log('decodedCLFReport');
    // console.log(decodedCLFReport);
    const decodedMessageResult = decodeMessageReportResult(decodedCLFReport.report.results[0]);
    const { srcChainSelector, dstChainSelector } = decodedMessageResult.decodedMessageConfig;
    const messageId = decodedMessageResult.messageId;

    // 2. go to src chain and fetch original message bytes
    const srcChain = getChainBySelector(srcChainSelector.toString());
    const { publicClient: srcPublicClient } = await getFallbackClients(srcChain);
    const [srcContractAddress] = getEnvAddress("router", srcChain.name);

    const currentBlock = await srcPublicClient.getBlockNumber();

    // Find the ConceroMessageSent event with our messageId
    const logs = await srcPublicClient.getLogs({
        address: srcContractAddress,
        event: getAbiItem({
            abi: globalConfig.ABI.CONCERO_ROUTER,
            name: eventNames.ConceroMessageSent,
        }) as AbiEvent,

        fromBlock: currentBlock - BigInt(1000),
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
    const dstChain = getChainBySelector(dstChainSelector.toString());

    const [dstConceroRouter] = getEnvAddress("router", dstChain.name);
    const { publicClient: dstPublicClient, walletClient: dstWalletClient } =
        await getFallbackClients(dstChain);

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
