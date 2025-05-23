import { AbiEvent, type Address, Log } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { LogResult } from "../../types/managers/ITxReader";
import { TxManager } from "../managers/TxManager";
import { logger } from "../utils/logger";

export interface EventListenerHandle {
    stop: () => void;
}

export async function setupEventListener<T>(
    network: ConceroNetwork,
    contractAddress: Address,
    onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
    event: AbiEvent,
): Promise<EventListenerHandle> {
    const txManager = TxManager.getInstance();

    const watcherId = txManager.logWatcher.create(
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
            txManager.logWatcher.remove(watcherId);
            logger.info(
                `[${network.name}] Stopped monitoring contract ${contractAddress} for ${event.name}`,
            );
        },
    };
}
