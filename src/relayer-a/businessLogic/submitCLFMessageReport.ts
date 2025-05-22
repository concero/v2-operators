import { AbiEvent, decodeEventLog, getAbiItem } from "viem";

import {
    BlockManager,
    BlockManagerRegistry,
    DeploymentManager,
    NetworkManager,
    TxManager,
    ViemClientManager,
} from "../../common/managers";
import { decodeCLFReport, decodeMessageReportResult, logger } from "../../common/utils";

import { globalConfig } from "../../constants";
import { DecodedLog } from "../../types/DecodedLog";

export async function submitCLFMessageReport(log: DecodedLog) {
    const networkManager = NetworkManager.getInstance();
    const viemClientManager = ViemClientManager.getInstance();
    const deploymentManager = DeploymentManager.getInstance();
    const blockManagerRegistry = BlockManagerRegistry.getInstance();
    const txManager = TxManager.getInstance();

    // Get active networks once at the beginning
    const activeNetworks = networkManager.getActiveNetworks();
    const activeNetworkNames = activeNetworks.map(network => network.name);

    try {
        const { transactionHash } = log;

        // 1. fetch & decode full CLF message report
        const verifierNetwork = networkManager.getVerifierNetwork();

        const { publicClient: verifierPublicClient } =
            viemClientManager.getClients(verifierNetwork);

        const messageReportTx = await verifierPublicClient.getTransaction({
            hash: transactionHash,
        });

        const decodedCLFReport = decodeCLFReport(messageReportTx);
        const decodedMessageResult = decodeMessageReportResult(decodedCLFReport.report.results[0]);
        const { srcChainSelector, dstChainSelector } = decodedMessageResult;
        const messageId = decodedMessageResult.messageId;

        // 2. go to src chain and fetch original message bytes
        const srcChain = networkManager.getNetworkBySelector(srcChainSelector.toString());

        if (!srcChain) {
            throw new Error(`No source chain found for selector ${srcChainSelector}`);
        }

        if (!activeNetworkNames.includes(srcChain.name)) {
            logger.warn(
                `[submitCLFMessageReport]: ${srcChain.name} is not active. Skipping message submission.`,
            );
            return;
        }

        const srcContractAddress = await deploymentManager.getRouterByChainName(srcChain.name);

        const srcBlockManager = blockManagerRegistry.getBlockManager(srcChain.name);
        if (!srcBlockManager) {
            logger.error(`[submitCLFMessageReport]: No BlockManager for ${srcChain.name}`);
            return;
        }

        const currentBlock = await srcBlockManager.getLatestBlock();
        if (!currentBlock) {
            throw new Error(`Could not retrieve latest block for chain ${srcChain.name}`);
        }

        const logs = await txManager.getLogs(
            {
                address: srcContractAddress,
                event: getAbiItem({
                    abi: globalConfig.ABI.CONCERO_ROUTER,
                    name: "ConceroMessageSent",
                }),
                fromBlock: currentBlock - BigInt(100), //TODO: report must include srcBlockNumber, 100 blocks is very unreliable
                toBlock: currentBlock,
                args: {
                    messageId,
                },
            },
            srcChain,
        );

        // Process logs if they don't already have decoded data
        const decodedLogs = logs.map(log => {
            if (log.decodedLog) return log;

            try {
                const decodedLog = decodeEventLog({
                    abi: globalConfig.ABI.CONCERO_ROUTER,
                    data: log.data,
                    topics: log.topics,
                    strict: true,
                });

                return { ...log, ...decodedLog };
            } catch (error) {
                logger.error(`[${srcChain.name}] Error decoding log: ${error}`);
                return log;
            }
        });

        // Find the ConceroMessageSent event
        const conceroMessageSentLog = decodedLogs.find(
            log =>
                log.eventName === "ConceroMessageSent" &&
                log.args?.messageId?.toLowerCase() === messageId.toLowerCase(),
        );

        if (!conceroMessageSentLog) {
            throw new Error(`Could not find ConceroMessageSent event with messageId ${messageId}`);
        }

        const { message } = conceroMessageSentLog.args;

        // 3. Send report + message to dst chain router
        const dstChain = networkManager.getNetworkBySelector(dstChainSelector.toString());
        if (!dstChain) {
            throw new Error(`No destination chain found for selector ${dstChainSelector}`);
        }

        if (!activeNetworkNames.includes(dstChain.name)) {
            logger.warn(
                `[submitCLFMessageReport]: ${dstChain.name} is not active. Skipping message submission.`,
            );
            return;
        }

        const dstBlockManager = blockManagerRegistry.getBlockManager(dstChain.name);
        if (!dstBlockManager) {
            logger.error(`[submitCLFMessageReport]: No BlockManager for ${dstChain.name}`);
            return;
        }

        const dstConceroRouter = await deploymentManager.getRouterByChainName(dstChain.name);

        const reportSubmission = {
            context: decodedCLFReport.reportContext,
            report: decodedCLFReport.reportBytes,
            rs: decodedCLFReport.rs,
            ss: decodedCLFReport.ss,
            rawVs: decodedCLFReport.rawVs,
        };

        if (globalConfig.TX_MANAGER.DRY_RUN) {
            logger.info(
                `[${dstChain.name}] CLF message report submitted with hash: dry-run-${Date.now()}`,
            );
            return;
        }

        const managedTx = await txManager.callContract({
            contractAddress: dstConceroRouter,
            abi: globalConfig.ABI.CONCERO_ROUTER,
            functionName: "submitMessageReport",
            args: [reportSubmission, message],
            chain: dstChain,
            messageId: messageId,
            options: {
                receiptConfirmations: 3,
                receiptTimeout: 60_000,
            },
        });

        const latestAttempt = managedTx.attempts[managedTx.attempts.length - 1];
        if (latestAttempt && latestAttempt.txHash) {
            logger.info(
                `[${dstChain.name}] CLF message report submitted with hash: ${latestAttempt.txHash}`,
            );
        } else {
            logger.error(`[${dstChain.name}] Failed to submit CLF message report transaction`);
        }
    } catch (e) {
        logger.error(`Error when submitting clf report: ${e}`);
    }
}
