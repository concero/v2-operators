import { v4 as uuidv4 } from "uuid";
import { Abi, AbiEvent, Address, Log } from "viem";

import { LoggerInterface } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxReaderConfig } from "../../types/ManagerConfigs";
import { INetworkManager, IViemClientManager } from "../../types/managers";
import {
    ITxReader,
    LogQuery,
    LogWatcher,
    ReadContractWatcher,
} from "../../types/managers/ITxReader";

export class TxReader implements ITxReader {
    private static instance: TxReader | undefined;
    private logWatchers: Map<string, LogWatcher> = new Map();
    private readContractWatchers: Map<string, ReadContractWatcher> = new Map();
    private readContractIntervals: Map<string, NodeJS.Timeout> = new Map();
    private logger: LoggerInterface;
    private networkManager: INetworkManager;
    private viemClientManager: IViemClientManager;

    private constructor(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        config: TxReaderConfig,
    ) {
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.logger = logger;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        config: TxReaderConfig,
    ): TxReader {
        TxReader.instance = new TxReader(logger, networkManager, viemClientManager, config);
        return TxReader.instance;
    }

    public static getInstance(): TxReader {
        if (!TxReader.instance) {
            throw new Error("TxReader is not initialized. Call createInstance() first.");
        }
        return TxReader.instance;
    }

    public async initialize(): Promise<void> {
        this.logger.info("Initialized");
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            network: ConceroNetwork,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
            blockManager: any,
        ): string => {
            const id = uuidv4();

            // Set up block watching for this specific watcher
            const unwatcher = blockManager.watchBlocks({
                onBlockRange: async (startBlock: bigint, endBlock: bigint) => {
                    await this.fetchLogsForWatcher(id, startBlock, endBlock);
                },
            });

            const watcher: LogWatcher = {
                id,
                network,
                contractAddress,
                event,
                callback: onLogs,
                blockManager,
                unwatch: unwatcher,
            };

            this.logWatchers.set(id, watcher);
            this.logger.debug(
                `Created log watcher for ${network.name}:${contractAddress} (${event.name})`,
            );
            return id;
        },
        remove: (watcherId: string): boolean => {
            const watcher = this.logWatchers.get(watcherId);
            if (!watcher) {
                this.logger.warn(`Failed to remove log watcher ${watcherId} (not found)`);
                return false;
            }

            watcher.unwatch();
            this.logWatchers.delete(watcherId);
            this.logger.info(`Removed log watcher ${watcherId}`);
            return true;
        },
    };

    public readContractWatcher = {
        create: (
            contractAddress: Address,
            network: ConceroNetwork,
            functionName: string,
            abi: Abi,
            callback: (result: any, network: ConceroNetwork) => Promise<void>,
            intervalMs: number = 10000,
            args?: any[],
        ): string => {
            const id = uuidv4();
            const watcher: ReadContractWatcher = {
                id,
                network,
                contractAddress,
                functionName,
                abi,
                args,
                intervalMs,
                callback,
            };

            this.readContractWatchers.set(id, watcher);

            // Start the interval
            const interval = setInterval(async () => {
                await this.executeReadContract(watcher);
            }, intervalMs);

            this.readContractIntervals.set(id, interval);

            // Execute immediately
            this.executeReadContract(watcher).catch(error => {
                this.logger.error(`Error in initial read contract execution (ID: ${id}):`, error);
            });

            this.logger.debug(
                `Created read contract watcher for ${network.name}:${contractAddress}.${functionName}`,
            );
            return id;
        },
        remove: (watcherId: string): boolean => {
            const watcher = this.readContractWatchers.get(watcherId);
            if (!watcher) {
                this.logger.warn(`Failed to remove read contract watcher ${watcherId} (not found)`);
                return false;
            }

            const interval = this.readContractIntervals.get(watcherId);
            if (interval) {
                clearInterval(interval);
                this.readContractIntervals.delete(watcherId);
            }

            this.readContractWatchers.delete(watcherId);
            this.logger.info(`Removed read contract watcher ${watcherId}`);
            return true;
        },
    };

    private async fetchLogsForWatcher(
        watcherId: string,
        fromBlock: bigint,
        toBlock: bigint,
    ): Promise<void> {
        const watcher = this.logWatchers.get(watcherId);
        if (!watcher) return;

        try {
            const logs = await this.getLogs(
                {
                    address: watcher.contractAddress,
                    event: watcher.event!,
                    fromBlock,
                    toBlock,
                },
                watcher.network,
            );

            if (logs.length > 0) {
                watcher.callback(logs, watcher.network).catch(error => {
                    this.logger.error(`Error in watcher callback (ID: ${watcher.id}):`, error);
                });
            }
        } catch (error) {
            this.logger.error(
                `Error fetching logs for ${watcher.contractAddress} on ${watcher.network.name}:`,
                error,
            );
        }
    }

    private async executeReadContract(watcher: ReadContractWatcher): Promise<void> {
        try {
            const { publicClient } = this.viemClientManager.getClients(watcher.network);

            const result = await publicClient.readContract({
                address: watcher.contractAddress,
                abi: watcher.abi,
                functionName: watcher.functionName,
                args: watcher.args,
            });

            await watcher.callback(result, watcher.network);
        } catch (error) {
            this.logger.error(`Error executing read contract (ID: ${watcher.id}):`, error);
        }
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
            return logs;
        } catch (error) {
            this.logger.error(`Error fetching logs on ${network.name}:`, error);
            return [];
        }
    }

    public dispose(): void {
        // Clean up all log watchers
        for (const [watcherId, watcher] of this.logWatchers.entries()) {
            watcher.unwatch();
        }

        // Clean up all read contract intervals
        for (const [watcherId, interval] of this.readContractIntervals.entries()) {
            clearInterval(interval);
        }

        this.logWatchers.clear();
        this.readContractWatchers.clear();
        this.readContractIntervals.clear();

        this.logger.info("Disposed");
    }
}
