import { AbiEvent, Address, Log } from "viem";

import { v4 as uuidv4 } from "uuid";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxReaderConfig } from "../../types/ManagerConfigs";
import { ITxReader, LogQuery, LogWatcher } from "../../types/managers/ITxReader";
import { LoggerInterface } from "../utils";

import { BlockManagerRegistry } from "./BlockManagerRegistry";
import { NetworkManager } from "./NetworkManager";
import { ViemClientManager } from "./ViemClientManager";

// Handles all log-reading operations for all networks
export class TxReader implements ITxReader {
    private static instance: TxReader | undefined;
    public logWatchers: Map<string, LogWatcher> = new Map();
    private cachedLogs: Map<string, Map<string, Log>> = new Map();
    private blockManagerUnwatchers: Map<string, () => void> = new Map();
    private logger: LoggerInterface;
    private config: TxReaderConfig;

    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;
    private blockManagerRegistry: BlockManagerRegistry;

    private constructor(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
        config: TxReaderConfig,
    ) {
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
        config: TxReaderConfig,
    ): TxReader {
        TxReader.instance = new TxReader(
            logger,
            networkManager,
            viemClientManager,
            blockManagerRegistry,
            config,
        );
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
        this.logger.info("Initialized");
    }

    private async subscribeToBlockUpdates(): Promise<void> {
        const activeNetworks = this.networkManager.getActiveNetworks();

        for (const network of activeNetworks) {
            const blockManager = this.blockManagerRegistry.getBlockManager(network.name);

            if (!blockManager) {
                continue;
            }

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
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
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
            this.logger.debug(
                `Created log watcher for ${chainName}:${contractAddress} (${event.name})`,
            );
            return id;
        },
        remove: (watcherId: string): boolean => {
            const result = this.logWatchers.delete(watcherId);
            if (result) {
                this.logger.info(`Removed log watcher ${watcherId}`);
            } else {
                this.logger.warn(`Failed to remove log watcher ${watcherId} (not found)`);
            }
            return result;
        },
    };

    public async fetchLogsForWatchers(
        chainName: string,
        fromBlock: bigint,
        toBlock: bigint,
    ): Promise<void> {
        this.logger.debug(`fetching logs for blocks ${fromBlock} - ${toBlock}`);
        const watchersForChain = Array.from(this.logWatchers.values()).filter(
            watcher => watcher.chainName === chainName,
        );

        if (watchersForChain.length === 0) return;

        const network = this.networkManager.getNetworkByName(chainName);
        if (!network) {
            this.logger.warn(`Unknown network: ${chainName}`);
            return;
        }

        // Initialize cache for this chain if it doesn't exist
        if (!this.cachedLogs.has(chainName)) {
            this.cachedLogs.set(chainName, new Map<string, Log>());
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

                // Group logs by event name to process them in batches
                const logsByEvent = new Map<string, Log[]>();

                for (const log of logs) {
                    const eventName = log.eventName || "";
                    const logId = `${log.transactionHash}:${log.logIndex}`;

                    // Skip logs we've already seen
                    if (chainCache.has(logId)) continue;
                    chainCache.set(logId, log);

                    const existingLogs = logsByEvent.get(eventName) || [];
                    existingLogs.push(log);
                    logsByEvent.set(eventName, existingLogs);
                }

                // Process logs for each watcher
                for (const watcher of contractWatchers) {
                    const eventName = watcher.event?.name || "";
                    const watcherLogs = logsByEvent.get(eventName) || [];

                    if (watcherLogs.length > 0) {
                        // it's an experiment. roll it back if fails
                        watcher.callback(watcherLogs, network).catch(error => {
                            this.logger.error(
                                `Error in watcher callback (ID: ${watcher.id}):`,
                                error,
                            );
                        });

                        // try {
                        //     await watcher.callback(watcherLogs, network);
                        // } catch (error) {
                        //     this.logger.error(
                        //         `Error in watcher callback (ID: ${watcher.id}):`,
                        //         error,
                        //     );
                        // }
                    }
                }
            } catch (error) {
                this.logger.error(
                    `Error fetching logs for ${contractAddress} on ${chainName}:`,
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
    ): Promise<Log[]> {
        if (events.length === 0) return [];

        const allLogs: Log[] = [];
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
            this.logger.error(`Error fetching logs on ${network.name}:`, error);
            return [];
        }
    }

    public dispose(): void {
        for (const [networkName, unwatcher] of this.blockManagerUnwatchers.entries()) {
            unwatcher();
            this.logger.info(`Unsubscribed from block updates for ${networkName}`);
        }

        this.blockManagerUnwatchers.clear();
        this.logWatchers.clear();
        this.cachedLogs.clear();

        this.logger.info("Disposed");
    }
}
