import { AbiEvent, getAbiItem } from "viem";

import { BlockManagerRegistry, Logger, NetworkManager } from "@concero/operator-utils";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { MessagingDeploymentManager } from "../../common/managers";

import { globalConfig } from "../../constants";

import { requestCLFMessageReport } from "../businessLogic/requestCLFMessageReport";
import { submitCLFMessageReport } from "../businessLogic/submitCLFMessageReport";

/**
 * Sets up event listeners for all active networks and the verifier network.
 * Uses the TxManager's new log watcher system to track specific events:
 * - ConceroMessageSent and ConceroMessageReceived on all ConceroRouters
 * - MessageReportRequested and MessageReport on the ConceroVerifier
 */
export async function setupEventListeners() {
    const logger = Logger.getInstance().getLogger("setupEventListeners");
    const networkManager = NetworkManager.getInstance();
    const deploymentManager = MessagingDeploymentManager.getInstance();
    const blockManagerRegistry = BlockManagerRegistry.getInstance();

    const activeNetworks = networkManager.getActiveNetworks();

    const eventListenerHandles = [];

    // Set up Router event listeners for each active network
    for (const network of activeNetworks) {
        const routerAddress = await deploymentManager.getRouterByChainName(network.name);
        const blockManager = blockManagerRegistry.getBlockManager(network.name);

        if (!blockManager) {
            logger.warn(`No block manager available for ${network.name}, skipping event setup`);
            continue;
        }

        try {
            // Create event watchers for ConceroMessageSent event
            const sentEvent = getAbiItem({
                abi: globalConfig.ABI.CONCERO_ROUTER,
                name: "ConceroMessageSent",
            });

            const sentHandle = await setupEventListener(
                network,
                routerAddress,
                requestCLFMessageReport,
                sentEvent as AbiEvent,
                blockManager,
            );
            eventListenerHandles.push(sentHandle);
            // logger.info(`[setupEventListeners] Created ConceroMessageSent watcher for ${network.name}`);

            // Create event watchers for ConceroMessageReceived event
            // const receivedEvent = getAbiItem({
            //     abi: globalConfig.ABI.CONCERO_ROUTER,
            //     name: "ConceroMessageReceived",
            // });

            // const receivedHandle = await setupEventListener(
            //     network,
            //     routerAddress,
            //     onRouterConceroReceivedLogs,
            //     receivedEvent as AbiEvent,
            // );
            // eventListenerHandles.push(receivedHandle);
            // logger.info(`[setupEventListeners] Created ConceroMessageReceived watcher for ${network.name}`);
        } catch (error) {
            logger.error(`Failed to set up router event listeners for ${network.name}:`, error);
        }
    }

    // Set up Verifier event listeners
    const verifierNetwork = networkManager.getVerifierNetwork();
    const verifierBlockManager = blockManagerRegistry.getBlockManager(verifierNetwork.name);

    if (!verifierBlockManager) {
        logger.error(`No block manager available for verifier network ${verifierNetwork.name}`);
        return;
    }

    const verifierAddress = await deploymentManager.getConceroVerifier();

    try {
        // Create event watcher for MessageReportRequested event
        // const reportRequestedEvent = getAbiItem({
        //     abi: globalConfig.ABI.CONCERO_VERIFIER,
        //     name: "MessageReportRequested",
        // });

        // const reportRequestedHandle = await setupEventListener(
        //     verifierNetwork,
        //     verifierAddress,
        //     onVerifierMessageReportRequestedLogs,
        //     reportRequestedEvent as AbiEvent,
        // );
        // eventListenerHandles.push(reportRequestedHandle);
        // logger.info('[setupEventListeners] Created MessageReportRequested watcher for verifier');

        // Create event watcher for MessageReport event
        const messageReportEvent = getAbiItem({
            abi: globalConfig.ABI.CONCERO_VERIFIER,
            name: "MessageReport",
        });

        const messageReportHandle = await setupEventListener(
            verifierNetwork,
            verifierAddress,
            submitCLFMessageReport,
            messageReportEvent as AbiEvent,
            verifierBlockManager,
        );
        eventListenerHandles.push(messageReportHandle);
    } catch (error) {
        logger.error("Failed to set up verifier event listeners:", error);
    }
}
