import { Logger } from '@concero/operator-utils';
import { AbiEvent, type Address, Log } from 'viem';

import { TxManager } from '../managers';
import { ConceroNetwork } from '../types/ConceroNetwork';

export interface EventListenerHandle {
    stop: () => void;
}

export async function setupEventListener<T>(
    network: ConceroNetwork,
    contractAddress: Address,
    onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
    event: AbiEvent,
    blockManager: any,
): Promise<EventListenerHandle> {
    const logger = Logger.getInstance().getLogger('setupEventListener');

    const txManager = TxManager.getInstance();

    const watcherId = txManager.logWatcher.create(
        contractAddress,
        network,
        async (logs, network) => {
            if (logs.length === 0) return;

            try {
                await onLogs(logs, network);
            } catch (error) {
                logger.error(
                    `${network.name} Error in onLogs callback for contract ${contractAddress}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                );
            }
        },
        event,
        blockManager,
    );

    return {
        stop: () => {
            txManager.logWatcher.remove(watcherId);
            logger.info(
                `${network.name} Stopped monitoring contract ${contractAddress} for ${event.name}`,
            );
        },
    };
}
