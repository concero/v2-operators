import { AbiEvent, Address, Hash, decodeEventLog } from "viem";
import { Log } from "viem";

import { v4 as uuidv4 } from "uuid";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxReader, LogQuery, LogResult, LogWatcher } from "../../types/managers/ITxReader";
import { logger } from "../utils";

import { BlockManagerRegistry } from "./BlockManagerRegistry";
import { NetworkManager } from "./NetworkManager";
import { ViemClientManager } from "./ViemClientManager";

export class TxReader implements ITxReader {
    private static instance: TxReader | undefined;
    public logWatchers: Map<string, LogWatcher> = new Map();
    private cachedLogs: Map<string, Map<string, LogResult>> = new Map();
    private blockManagerUnwatchers: Map<string, () => void> = new Map();

    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;
    private blockManagerRegistry: BlockManagerRegistry;

    private constructor(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
    ) {
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
    }

    public static createInstance(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
    ): TxReader {
        TxReader.instance = new TxReader(networkManager, viemClientManager, blockManagerRegistry);
        return TxReader.instance;
    }

    public static getInstance(): TxReader {
        if (!TxReader.instance) {
            throw new Error("TxReader is not initialized. Call createInstance() first.");
        }
        return TxReader.instance;
    }

    public async initialize(): Promise<void> {
        await this.subscribeToBlockUpdates();
        logger.info("[TxReader]: Initialized successfully");
    }

    private async subscribeToBlockUpdates(): Promise<void> {
        const activeNetworks = this.networkManager.getActiveNetworks();

        for (const network of activeNetworks) {
            const blockManager = this.blockManagerRegistry.getBlockManager(network.name);

            const unwatcher = blockManager.watchBlocks({
                onBlockRange: async (startBlock, endBlock) => {
                    await this.fetchLogsForWatchers(network.name, startBlock, endBlock);
                },
            });

            this.blockManagerUnwatchers.set(network.name, unwatcher);
        }
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
        ): string => {
            const id = uuidv4();
            const watcher = {
                id,
                chainName,
                contractAddress,
                event,
                callback: onLogs,
            };

            this.logWatchers.set(id, watcher);
            logger.debug(
                `[TxReader] Created log watcher for ${chainName}:${contractAddress} (${event.name})`,
            );
            return id;
        },
        remove: (watcherId: string): boolean => {
            const result = this.logWatchers.delete(watcherId);
            if (result) {
                logger.info(`[TxReader] Removed log watcher ${watcherId}`);
            } else {
                logger.warn(`[TxReader] Failed to remove log watcher ${watcherId} (not found)`);
            }
            return result;
        },
    };

    public async fetchLogsForWatchers(
        chainName: string,
        fromBlock: bigint,
        toBlock: bigint,
    ): Promise<void> {
        const watchersForChain = Array.from(this.logWatchers.values()).filter(
            watcher => watcher.chainName === chainName,
        );

        if (watchersForChain.length === 0) return;

        const network = this.networkManager.getNetworkByName(chainName);
        if (!network) {
            logger.warn(`[TxReader] Unknown network: ${chainName}`);
            return;
        }

        // Initialize cache for this chain if it doesn't exist
        if (!this.cachedLogs.has(chainName)) {
            this.cachedLogs.set(chainName, new Map<string, LogResult>());
        }
        const chainCache = this.cachedLogs.get(chainName)!;

        const watchersByContract = this.groupWatchersByContract(watchersForChain);

        for (const [contractAddress, contractWatchers] of watchersByContract) {
            try {
                const events = contractWatchers.map(w => w.event);
                const logs = await this.getContractLogs(
                    contractAddress,
                    fromBlock,
                    toBlock,
                    events,
                    network,
                );

                for (const watcher of contractWatchers) {
                    const watcherLogs = logs.filter(log => {
                        if (log.eventName !== watcher.event.name) return false;

                        const logId = `${log.transactionHash}:${log.logIndex}`;
                        if (chainCache.has(logId)) return false;

                        chainCache.set(logId, log);
                        return true;
                    });

                    if (watcherLogs.length > 0) {
                        try {
                            await watcher.callback(watcherLogs, network);
                        } catch (error) {
                            logger.error(
                                `[TxReader] Error in watcher callback (ID: ${watcher.id}):`,
                                error,
                            );
                        }
                    }
                }
            } catch (error) {
                logger.error(
                    `[TxReader] Error fetching logs for ${contractAddress} on ${chainName}:`,
                    error,
                );
            }
        }
    }

    private groupWatchersByContract(watchers: LogWatcher[]): Map<Address, LogWatcher[]> {
        const result = new Map<Address, LogWatcher[]>();

        for (const watcher of watchers) {
            const existing = result.get(watcher.contractAddress) || [];
            existing.push(watcher);
            result.set(watcher.contractAddress, existing);
        }

        return result;
    }

    private async getContractLogs(
        contractAddress: Address,
        fromBlock: bigint,
        toBlock: bigint,
        events: AbiEvent[],
        network: ConceroNetwork,
    ): Promise<LogResult[]> {
        if (events.length === 0) return [];

        const allLogs: LogResult[] = [];
        for (const event of events) {
            const eventLogs = await this.getLogs(
                {
                    address: contractAddress,
                    event,
                    fromBlock,
                    toBlock,
                },
                network,
            );

            allLogs.push(...eventLogs);
        }

        return allLogs;
    }

    public async getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]> {
        const { publicClient } = this.viemClientManager.getClients(network);
        try {
            const filter = {
                address: query.address,
                fromBlock: query.fromBlock,
                toBlock: query.toBlock,
                event: query.event,
            };

            if (query.args) {
                filter.args = query.args;
            }

            const logs = await publicClient.getLogs(filter);

            // console.log(query, logs);
            return logs;
        } catch (error) {
            logger.error(`[TxReader] Error fetching logs on ${network.name}:`, error);
            return [];
        }
    }

    public dispose(): void {
        for (const [networkName, unwatcher] of this.blockManagerUnwatchers.entries()) {
            unwatcher();
            logger.info(`[TxReader] Unsubscribed from block updates for ${networkName}`);
        }

        this.blockManagerUnwatchers.clear();
        this.logWatchers.clear();
        this.cachedLogs.clear();

        logger.info("[TxReader]: Disposed");
    }
}
