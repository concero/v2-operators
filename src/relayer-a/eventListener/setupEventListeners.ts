import { AbiEvent, getAbiItem } from "viem";

import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { DeploymentManager, NetworkManager } from "../../common/managers";
import { Logger } from "../../common/utils/logger";

import { globalConfig } from "../../constants";

import { onRouterConceroSentLogs, onVerifierMessageReportLogs } from "./onLogs";

/**
 * Sets up event listeners for all active networks and the verifier network.
 * Uses the TxManager's new log watcher system to track specific events:
 * - ConceroMessageSent and ConceroMessageReceived on all ConceroRouters
 * - MessageReportRequested and MessageReport on the ConceroVerifier
 */
export async function setupEventListeners() {
    const logger = Logger.getInstance().getLogger("setupEventListeners");
    const networkManager = NetworkManager.getInstance();
    const deploymentManager = DeploymentManager.getInstance();

    const activeNetworks = networkManager.getActiveNetworks();

    const eventListenerHandles = [];

    // Set up Router event listeners for each active network
    for (const network of activeNetworks) {
        const routerAddress = await deploymentManager.getRouterByChainName(network.name);

        try {
            // Create event watchers for ConceroMessageSent event
            const sentEvent = getAbiItem({
                abi: globalConfig.ABI.CONCERO_ROUTER,
                name: "ConceroMessageSent",
            });

            const sentHandle = await setupEventListener(
                network,
                routerAddress,
                onRouterConceroSentLogs,
                sentEvent as AbiEvent,
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
            onVerifierMessageReportLogs,
            messageReportEvent as AbiEvent,
        );
        eventListenerHandles.push(messageReportHandle);
    } catch (error) {
        logger.error("Failed to set up verifier event listeners:", error);
    }
}
