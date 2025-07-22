import { AbiEvent, Address, Log } from "viem";

import { v4 as uuidv4 } from "uuid";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxReaderConfig } from "../../types/ManagerConfigs";
import { IBlockManagerRegistry, INetworkManager, IViemClientManager } from "../../types/managers";
import { FailedBlockRange, ITxReader, LogQuery, LogWatcher } from "../../types/managers/ITxReader";
import { LoggerInterface } from "../utils";
import { DbManager } from "./DbManager";

// Handles all log-reading operations for all networks
export class TxReader implements ITxReader {
    private static instance: TxReader | undefined;
    public logWatchers: Map<string, LogWatcher> = new Map();
    private cachedLogs: Map<string, Map<string, Log>> = new Map();
    private blockManagerUnwatchers: Map<string, () => void> = new Map();
    private logger: LoggerInterface;
    private config: TxReaderConfig;
    private prisma = DbManager.getClient();

    private networkManager: INetworkManager;
    private viemClientManager: IViemClientManager;
    private blockManagerRegistry: IBlockManagerRegistry;

    private constructor(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        blockManagerRegistry: IBlockManagerRegistry,
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
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        blockManagerRegistry: IBlockManagerRegistry,
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
                onBlockRange: async (startBlock: bigint, endBlock: bigint) => {
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
        await this.processPendingFailedBlocks(chainName);

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
                const events = contractWatchers
                    .map(w => w.event)
                    .filter((event): event is AbiEvent => event !== undefined);
                const logs = await this.getContractLogs(
                    contractAddress,
                    fromBlock,
                    toBlock,
                    events,
                    network,
                );

                // Process logs for watchers
                await this.processLogsForWatchers(logs, contractWatchers, network, chainCache);
            } catch (error) {
                this.logger.error(
                    `Error fetching logs for ${contractAddress} on ${chainName}: ${error}`,
                );

                await this.saveFailedBlock(
                    chainName,
                    contractAddress,
                    fromBlock,
                    toBlock,
                    error as Error,
                );
            }
        }
    }

    private async processPendingFailedBlocks(chainName: string): Promise<void> {
        const failedBlocks = await this.prisma.failedLogFetch.findMany({
            where: {
                network: chainName,
            },
            orderBy: [{ fromBlock: "asc" }, { contractAddress: "asc" }],
        });

        if (failedBlocks.length === 0) return;

        this.logger.debug(
            `Processing ${failedBlocks.length} pending failed blocks for ${chainName}`,
        );

        // Group by block ranges for efficiency
        const blockRanges = this.groupFailedBlocksByRange(failedBlocks);

        for (const range of blockRanges) {
            await this.retryFailedRange(chainName, range);
        }
    }

    private async retryFailedRange(chainName: string, range: FailedBlockRange): Promise<void> {
        const network = this.networkManager.getNetworkByName(chainName);
        if (!network) return;

        this.logger.debug(
            `Retrying failed blocks ${range.fromBlock}-${range.toBlock} for ${range.contracts.size} contracts`,
        );

        for (const contractAddress of range.contracts) {
            try {
                // Get watchers for this contract
                const contractWatchers = Array.from(this.logWatchers.values()).filter(
                    w => w.chainName === chainName && w.contractAddress === contractAddress,
                );

                if (contractWatchers.length === 0) {
                    // No watchers anymore, remove from failed
                    await this.removeFailedBlock(
                        chainName,
                        contractAddress,
                        range.fromBlock,
                        range.toBlock,
                    );
                    continue;
                }

                const chainCache = this.cachedLogs.get(chainName)!;

                const events = contractWatchers
                    .map(w => w.event)
                    .filter((event): event is AbiEvent => event !== undefined);

                const logs = await this.getContractLogs(
                    contractAddress,
                    range.fromBlock,
                    range.toBlock,
                    events,
                    network,
                );

                // Process logs for watchers
                await this.processLogsForWatchers(logs, contractWatchers, network, chainCache);

                // Success! Remove from failed
                await this.removeFailedBlock(
                    chainName,
                    contractAddress,
                    range.fromBlock,
                    range.toBlock,
                );

                this.logger.info(
                    `Successfully retried failed blocks ${range.fromBlock}-${range.toBlock} for ${contractAddress}`,
                );
            } catch (error) {
                this.logger.warn(
                    `Retry failed for ${contractAddress} blocks ${range.fromBlock}-${range.toBlock}: ${error}`,
                );
                // Increment retry count
                await this.incrementRetryCount(
                    chainName,
                    contractAddress,
                    range.fromBlock,
                    range.toBlock,
                );
            }
        }
    }

    private async processLogsForWatchers(
        logs: Log[],
        contractWatchers: LogWatcher[],
        network: ConceroNetwork,
        chainCache: Map<string, Log>,
    ): Promise<void> {
        // Group logs by event name to process them in batches
        const logsByEvent = new Map<string, Log[]>();

        for (const log of logs) {
            const eventName = (log as any).eventName || "";
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
                watcher.callback(watcherLogs, network).catch(error => {
                    this.logger.error(`Error in watcher callback (ID: ${watcher.id}):`, error);
                });
            }
        }
    }

    private async removeFailedBlock(
        network: string,
        contractAddress: string,
        fromBlock: bigint,
        toBlock: bigint,
    ): Promise<void> {
        try {
            const deleted = await this.prisma.failedLogFetch.deleteMany({
                where: {
                    network,
                    contractAddress,
                    fromBlock,
                    toBlock,
                },
            });

            if (deleted.count > 0) {
                this.logger.debug(
                    `Removed ${deleted.count} failed block records for ${network}:${contractAddress} blocks ${fromBlock}-${toBlock}`,
                );
            }
        } catch (error) {
            this.logger.error("Failed to remove successful block from failed list:", error);
        }
    }

    private async incrementRetryCount(
        network: string,
        contractAddress: string,
        fromBlock: bigint,
        toBlock: bigint,
    ): Promise<void> {
        try {
            await this.prisma.failedLogFetch.updateMany({
                where: {
                    network,
                    contractAddress,
                    fromBlock,
                    toBlock,
                },
                data: {
                    retryCount: { increment: 1 },
                },
            });
        } catch (error) {
            this.logger.error("Failed to increment retry count:", error);
        }
    }

    private async saveFailedBlock(
        network: string,
        contractAddress: string,
        fromBlock: bigint,
        toBlock: bigint,
        error: Error,
    ): Promise<void> {
        try {
            await this.prisma.failedLogFetch.upsert({
                where: {
                    network_contractAddress_fromBlock_toBlock: {
                        network,
                        contractAddress,
                        fromBlock,
                        toBlock,
                    },
                },
                update: {
                    retryCount: { increment: 1 },
                    errorMessage: error.message,
                },
                create: {
                    network,
                    contractAddress,
                    fromBlock,
                    toBlock,
                    errorMessage: error.message,
                    retryCount: 0,
                },
            });

            this.logger.debug(
                `Saved failed block for retry: ${network}:${contractAddress} blocks ${fromBlock}-${toBlock}`,
            );
        } catch (dbError) {
            this.logger.error("Failed to save failed block to DB:", dbError);
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

    private groupFailedBlocksByRange(failedBlocks: any[]): FailedBlockRange[] {
        const ranges = new Map<string, FailedBlockRange>();

        for (const block of failedBlocks) {
            const key = `${block.fromBlock}-${block.toBlock}`;
            if (!ranges.has(key)) {
                ranges.set(key, {
                    fromBlock: block.fromBlock,
                    toBlock: block.toBlock,
                    contracts: new Set(),
                });
            }
            ranges.get(key)!.contracts.add(block.contractAddress);
        }

        return Array.from(ranges.values());
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
                ...(query.args && { args: query.args }),
            };

            const logs = await publicClient.getLogs(filter);

            // console.log(query, logs);
            return logs;
        } catch (error) {
            this.logger.error(`Error fetching logs on ${network.name}: ${error}`);
            throw error;
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
