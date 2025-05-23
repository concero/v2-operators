import { getAbiItem } from "viem";

import {
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

    const activeNetworks = networkManager.getActiveNetworks();
    const activeNetworkNames = activeNetworks.map(network => network.name);

    try {
        // 1. fetch & decode full CLF message report
        const verifierNetwork = networkManager.getVerifierNetwork();

        const { publicClient: verifierPublicClient } =
            viemClientManager.getClients(verifierNetwork);

        const messageReportTx = await verifierPublicClient.getTransaction({
            hash: log.transactionHash,
        });

        const decodedCLFReport = decodeCLFReport(messageReportTx);
        const decodedMessageResult = decodeMessageReportResult(decodedCLFReport.report.results[0]);
        const { srcChainSelector, dstChainSelector, messageId } = decodedMessageResult;

        // 2. go to src chain and fetch original message bytes
        const srcChain = networkManager.getNetworkBySelector(srcChainSelector.toString());

        if (!activeNetworkNames.includes(srcChain.name)) {
            logger.warn(
                `[submitCLFMessageReport]: ${srcChain.name} is not active. Skipping message with id ${messageId}`,
            );
            return;
        }

        const srcContractAddress = await deploymentManager.getRouterByChainName(srcChain.name);
        const srcBlockManager = blockManagerRegistry.getBlockManager(srcChain.name);
        const currentBlock = await srcBlockManager.getLatestBlock();

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
                fromBlock: currentBlock - BigInt(300), //TODO: report must include srcBlockNumber, 100 blocks is very unreliable
                toBlock: currentBlock,
            },
            srcChain,
        );

        if (decodedLogs.length === 0) {
            logger.warn(
                `[submitCLFMessageReport] ${srcChain.name}: No decodedLogs found for messageId ${messageId} in the last 100 blocks.`,
            );
        } else {
            logger.info(
                `[submitCLFMessageReport] ${srcChain.name}: Found ${decodedLogs.length} decodedLogs for messageId ${messageId}`,
            );
        }

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

        const { walletClient, publicClient } = viemClientManager.getClients(dstChain);
        const managedTx = await txManager.callContract(walletClient, publicClient, {
            contractAddress: dstConceroRouter,
            abi: globalConfig.ABI.CONCERO_ROUTER,
            functionName: "submitMessageReport",
            args: [reportSubmission, message],
            chain: dstChain,
            messageId: messageId,
        });

        if (managedTx && managedTx.txHash) {
            logger.info(
                `[${dstChain.name}] CLF message report submitted with hash: ${managedTx.txHash}`,
            );
        } else {
            logger.error(
                `[${dstChain.name}] Failed to submit CLF message report transaction for messageId ${messageId}`,
            );
        }
    } catch (e) {
        logger.error(`Error when submitting clf report: ${e}`);
    }
}
