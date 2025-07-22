import { Log, decodeAbiParameters, getAbiItem } from "viem";

import {
    BlockManagerRegistry,
    Logger,
    NetworkManager,
    TxWriter,
    ViemClientManager,
} from "@concero/operator-utils";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { MessagingDeploymentManager, TxManager } from "../../common/managers";
import { decodeCLFReport, decodeMessageReportResult } from "../../common/utils";
import { DecodedMessageReportResult } from "../../common/utils/decoders/types";

import { globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { DecodedLog } from "../../types/DecodedLog";

async function parseMessageResults(decodedCLFReport: any, logger: any) {
    const messageResults: DecodedMessageReportResult[] = [];

    for (let i = 0; i < decodedCLFReport.report.results.length; i++) {
        try {
            const decodedResult = decodeMessageReportResult(decodedCLFReport.report.results[i]);
            messageResults.push(decodedResult);
            logger.debug(`Successfully decoded result ${i}: messageId ${decodedResult.messageId}`);
        } catch (error) {
            logger.error(`Failed to decode result ${i}: ${error}`);
        }
    }

    return messageResults;
}

function groupMessagesByDestination(messageResults: DecodedMessageReportResult[]) {
    const messagesByDstChain = new Map<
        string,
        {
            results: DecodedMessageReportResult[];
            indexes: number[];
        }
    >();

    messageResults.forEach((result, index) => {
        const dstChainSelector = result.dstChainSelector.toString();

        if (!messagesByDstChain.has(dstChainSelector)) {
            messagesByDstChain.set(dstChainSelector, { results: [], indexes: [] });
        }

        messagesByDstChain.get(dstChainSelector)!.results.push(result);
        messagesByDstChain.get(dstChainSelector)!.indexes.push(index);
    });

    return messagesByDstChain;
}

async function fetchOriginalMessage(
    result: DecodedMessageReportResult,
    activeNetworkNames: string[],
    networkManager: NetworkManager,
    deploymentManager: MessagingDeploymentManager,
    blockManagerRegistry: BlockManagerRegistry,
    txManager: TxManager,
    logger: any,
) {
    const { srcChainSelector, messageId, srcBlockNumber } = result;
    const srcChain = networkManager.getNetworkBySelector(srcChainSelector.toString());

    if (!activeNetworkNames.includes(srcChain.name)) {
        logger.warn(`${srcChain.name} is not active. Skipping message with id ${messageId}`);
        return { message: null, gasLimit: BigInt(0) };
    }

    const srcContractAddress = await deploymentManager.getRouterByChainName(srcChain.name);
    const srcBlockManager = blockManagerRegistry.getBlockManager(srcChain.name);

    const decodedLogs = await txManager.getLogs(
        {
            address: srcContractAddress,
            event: getAbiItem({
                abi: globalConfig.ABI.CONCERO_ROUTER,
                name: "ConceroMessageSent",
            }),
            args: {
                messageId,
            },
            fromBlock: srcBlockNumber - BigInt(1),
            toBlock: srcBlockNumber + BigInt(1),
        },
        srcChain,
    );

    if (decodedLogs.length === 0) {
        logger.warn(
            `${srcChain.name}: No decodedLogs found for messageId ${messageId} around block ${srcBlockNumber}.`,
        );
        return { message: null, gasLimit: BigInt(0) };
    }

    // Find the ConceroMessageSent event
    const conceroMessageSentLog = decodedLogs.find(
        log =>
            log.eventName === "ConceroMessageSent" &&
            log.args?.messageId?.toLowerCase() === messageId.toLowerCase(),
    );

    if (!conceroMessageSentLog) {
        logger.error(`Could not find ConceroMessageSent event with messageId ${messageId}`);
        return { message: null, gasLimit: BigInt(0) };
    }

    const { message, dstChainData } = conceroMessageSentLog.args;

    // Add up gas limits for all messages to ensure enough gas for the batch
    const decodedDstChainData = decodeAbiParameters(
        [globalConfig.ABI.EVM_DST_CHAIN_DATA],
        dstChainData,
    )[0];

    return { message, gasLimit: decodedDstChainData.gasLimit };
}

async function submitBatchToDestination(
    dstChain: any,
    reportSubmission: any,
    messages: string[],
    indexes: number[],
    results: DecodedMessageReportResult[],
    totalGasLimit: bigint,
    deploymentManager: MessagingDeploymentManager,
    txWriter: TxWriter,
    logger: any,
) {
    if (globalConfig.TX_MANAGER.DRY_RUN) {
        logger.info(
            `[${dstChain.name}] Dry run: CLF message report with ${messages.length} messages would be submitted`,
        );
        return;
    }

    const dstConceroRouter = await deploymentManager.getRouterByChainName(dstChain.name);

    const txHash = await txWriter.callContract(dstChain, {
        address: dstConceroRouter,
        abi: globalConfig.ABI.CONCERO_ROUTER,
        functionName: "submitMessageReport",
        args: [reportSubmission, messages, indexes.map(index => BigInt(index))],
        chain: dstChain.viemChain,
        gas:
            totalGasLimit +
            BigInt(messages.length) *
                globalConfig.TX_MANAGER.GAS_LIMIT.SUBMIT_MESSAGE_REPORT_OVERHEAD,
    });

    const messageIds = results.map(result => result.messageId).join(", ");

    if (txHash) {
        logger.info(
            `[${dstChain.name}] CLF Report with ${messages.length} results submitted with hash: ${txHash}`,
        );
        logger.debug(`[${dstChain.name}] Message IDs in batch: ${messageIds}`);
    } else {
        logger.error(
            `[${dstChain.name}] Failed to submit batch of CLF message reports. Message IDs: ${messageIds}`,
        );
    }
}

/**
 * Adapter function that takes viem Log objects and the network,
 * decodes them and passes them to the main processMessageReports function
 */
export async function submitCLFMessageReport(logs: Log[], network?: ConceroNetwork) {
    if (logs.length === 0) return;

    const logger = Logger.getInstance().getLogger("processMessageReports");
    logger.debug(`Processing ${logs.length} MessageReport logs`);

    try {
        // Decode the logs
        const decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_VERIFIER);
        await processMessageReports(decodedLogs);
    } catch (error) {
        logger.error(`Error processing message report logs: ${error}`);
    }
}

/**
 * Main function that processes decoded message report logs
 */
async function processMessageReports(logs: DecodedLog[]) {
    const logger = Logger.getInstance().getLogger("submitCLFMessageReport");
    const networkManager = NetworkManager.getInstance();
    const blockManagerRegistry = BlockManagerRegistry.getInstance();
    const viemClientManager = ViemClientManager.getInstance();
    const deploymentManager = MessagingDeploymentManager.getInstance();
    const txManager = TxManager.getInstance();
    const txWriter = TxWriter.getInstance();

    const activeNetworks = networkManager.getActiveNetworks();
    const activeNetworkNames = activeNetworks.map(network => network.name);

    try {
        // Group logs by transaction hash
        const txHashToLogs = new Map<string, DecodedLog[]>();

        for (const log of logs) {
            const txHash = log.transactionHash;
            const existingLogs = txHashToLogs.get(txHash) || [];
            existingLogs.push(log);
            txHashToLogs.set(txHash, existingLogs);
        }

        // Process transactions in parallel
        const txProcessPromises = Array.from(txHashToLogs.entries()).map(
            async ([txHash, txLogs]) => {
                logger.debug(`Processing transaction ${txHash} with ${txLogs.length} logs`);

                try {
                    // 1. Fetch and decode the CLF report
                    const verifierNetwork = networkManager.getVerifierNetwork();
                    const { publicClient: verifierPublicClient } =
                        viemClientManager.getClients(verifierNetwork);

                    const messageReportTx = await verifierPublicClient.getTransaction({
                        hash: txHash,
                    });

                    const decodedCLFReport = decodeCLFReport(messageReportTx);
                    logger.debug(
                        `Report contains ${decodedCLFReport.report.results.length} results`,
                    );

                    // 2. Parse the message results
                    const messageResults = await parseMessageResults(decodedCLFReport, logger);

                    if (messageResults.length === 0) {
                        logger.warn(
                            `No valid message results found in the report for transaction ${txHash}`,
                        );
                        return;
                    }

                    // 3. Group messages by destination chain
                    const messagesByDstChain = groupMessagesByDestination(messageResults);

                    // 4. Create the report submission object
                    const reportSubmission = {
                        context: decodedCLFReport.reportContext,
                        report: decodedCLFReport.reportBytes,
                        rs: decodedCLFReport.rs,
                        ss: decodedCLFReport.ss,
                        rawVs: decodedCLFReport.rawVs,
                    };

                    // 5. Process each destination chain in parallel
                    const dstChainProcessPromises = Array.from(messagesByDstChain.entries()).map(
                        async ([dstChainSelector, { results, indexes }]) => {
                            const dstChain = networkManager.getNetworkBySelector(dstChainSelector);

                            if (!activeNetworkNames.includes(dstChain.name)) {
                                logger.warn(
                                    `${dstChain.name} is not active. Skipping message submission.`,
                                );
                                return;
                            }

                            const dstBlockManager = blockManagerRegistry.getBlockManager(
                                dstChain.name,
                            );
                            if (!dstBlockManager) {
                                logger.error(`No BlockManager for ${dstChain.name}`);
                                return;
                            }

                            // 6. Fetch original messages from source chains in parallel
                            const messagePromises = results.map(result =>
                                fetchOriginalMessage(
                                    result,
                                    activeNetworkNames,
                                    networkManager,
                                    deploymentManager,
                                    blockManagerRegistry,
                                    txManager,
                                    logger,
                                ),
                            );

                            const resolvedMessages = await Promise.all(messagePromises);

                            const messages: string[] = [];
                            let totalGasLimit = BigInt(0);

                            for (const { message, gasLimit } of resolvedMessages) {
                                if (message) {
                                    messages.push(message);
                                    totalGasLimit += gasLimit;
                                }
                            }

                            if (messages.length !== results.length) {
                                logger.error(
                                    `[${dstChain.name}] Could only find ${messages.length}/${results.length} messages. Skipping batch submission.`,
                                );
                                return;
                            }

                            // 7. Submit the batch to destination chain
                            await submitBatchToDestination(
                                dstChain,
                                reportSubmission,
                                messages,
                                indexes,
                                results,
                                totalGasLimit,
                                deploymentManager,
                                txWriter,
                                logger,
                            );
                        },
                    );

                    await Promise.all(dstChainProcessPromises);
                } catch (error) {
                    logger.error(`Error processing transaction ${txHash}: ${error}`);
                }
            },
        );

        await Promise.all(txProcessPromises);
    } catch (e) {
        logger.error(`Error when submitting clf report: ${e}`);
    }
}
