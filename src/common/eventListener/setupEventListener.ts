import { AbiEvent, type Address, Log } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { LogResult, TxManager } from "../managers/TxManager";
import { logger } from "../utils/logger";

export interface EventListenerHandle {
    stop: () => void;
}

export async function setupEventListener<T>(
    network: ConceroNetwork,
    contractAddress: Address,
    onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>,
    event?: AbiEvent,
): Promise<EventListenerHandle> {
    // Verify that contract address is available
    if (!contractAddress) {
        throw new Error(`Contract address is required for network ${network.name}`);
    }

    const txManager = TxManager.getInstance();

    const eventName = event ? event.name : "all events";
    logger.info(
        `[setupEventListener] ${network.name} Monitoring contract ${contractAddress} for ${eventName}`,
    );

    // Create a log watcher in TxManager with specific event filter if provided
    const watcherId = txManager.createLogWatcher(
        contractAddress,
        network.name,
        async (logs, network) => {
            if (logs.length === 0) return;

            try {
                await onLogs(logs, network);
            } catch (error) {
                logger.error(
                    `[${network.name}] Error in onLogs callback for contract ${contractAddress}:`,
                    error,
                );
            }
        },
        event,
    );

    return {
        stop: () => {
            txManager.removeLogWatcher(watcherId);
            logger.info(
                `[${network.name}] Stopped monitoring contract ${contractAddress} for ${eventName}`,
            );
        },
    };
}
