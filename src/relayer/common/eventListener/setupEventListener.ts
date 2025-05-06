import { Log, type Address } from "viem";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { logger } from "../utils";
import { viemClientManager } from "../../common/managers/ViemClientManager";
import { blockCheckpointManager } from "../managers/BlockCheckpointManager";

export interface EventListenerHandle {
    stop: () => void;
}

export async function setupEventListener<T>(
    network: ConceroNetwork,
    contractAddress: Address,
    onLogs: (logs: Log[], network: ConceroNetwork) => void,
    pollingIntervalMs: number,
): Promise<EventListenerHandle> {
    const { publicClient } = viemClientManager.getClients(network);

    const initialBlockNumber = await determineStartingBlock(network);

    logger.info(
        `[${network.name}] Monitoring contract: ${contractAddress} from block ${initialBlockNumber}`,
    );

    let lastProcessedBlock = initialBlockNumber;

    const unwatchFn = publicClient.watchBlocks({
        emitMissed: true,
        pollingInterval: pollingIntervalMs,
        onBlock: async block => {
            try {
                const currentBlockNumber =
                    block.number !== null ? block.number : await publicClient.getBlockNumber();

                if (currentBlockNumber <= lastProcessedBlock) {
                    return;
                }

                const logs = await publicClient.getLogs({
                    address: contractAddress,
                    fromBlock: lastProcessedBlock + 1n,
                    toBlock: currentBlockNumber,
                });

                if (logs.length > 0) {
                    onLogs(logs, network);
                }

                lastProcessedBlock = currentBlockNumber;
                blockCheckpointManager.updateLastProcessedBlock(network, lastProcessedBlock);
            } catch (error) {
                logger.error(
                    `[${network.name}] Error processing block for contract ${contractAddress}:`,
                    error,
                );
            }
        },
        onError: error => {
            logger.error(
                `[${network.name}] Error in watchBlocks for contract ${contractAddress}:`,
                error,
            );
        },
    });

    return {
        stop: () => {
            unwatchFn();
            logger.info(`[${network.name}] Stopped monitoring contract: ${contractAddress}`);
        },
    };
}

async function determineStartingBlock(network: ConceroNetwork): Promise<bigint> {
    const { publicClient } = viemClientManager.getClients(network);
    const savedBlock = blockCheckpointManager.getLastProcessedBlock(network);

    if (savedBlock !== undefined) {
        logger.info(`[${network.name}] Resuming from previously saved block ${savedBlock}`);
        return savedBlock;
    }

    const currentBlock = await publicClient.getBlockNumber();
    return currentBlock;
}
