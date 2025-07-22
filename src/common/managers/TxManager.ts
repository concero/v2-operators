import { Abi, AbiEvent, Address, Log, SimulateContractParameters } from "viem";

import { LoggerInterface } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxManagerConfig } from "../../types/ManagerConfigs";
import { INetworkManager, ITxManager, ITxMonitor, IViemClientManager } from "../../types/managers";
import { ITxReader, LogQuery } from "../../types/managers/ITxReader";
import { ITxWriter } from "../../types/managers/ITxWriter";

import { ManagerBase } from "./ManagerBase";

// High-level interface for both reading & writing to the network
export class TxManager extends ManagerBase implements ITxManager {
    private static instance: TxManager | undefined;

    private readonly txWriter: ITxWriter;
    private readonly txReader: ITxReader;
    private readonly txMonitor: ITxMonitor;
    private readonly networkManager: INetworkManager;
    private readonly viemClientManager: IViemClientManager;
    private logger: LoggerInterface;
    private config: TxManagerConfig;

    private constructor(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        txWriter: ITxWriter,
        txReader: ITxReader,
        txMonitor: ITxMonitor,
        config: TxManagerConfig,
    ) {
        super();
        this.logger = logger;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.txWriter = txWriter;
        this.txReader = txReader;
        this.txMonitor = txMonitor;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        txWriter: ITxWriter,
        txReader: ITxReader,
        txMonitor: ITxMonitor,
        config: TxManagerConfig,
    ): TxManager {
        if (!TxManager.instance) {
            TxManager.instance = new TxManager(
                logger,
                networkManager,
                viemClientManager,
                txWriter,
                txReader,
                txMonitor,
                config,
            );
        }
        return TxManager.instance;
    }

    public static getInstance(): TxManager {
        if (!TxManager.instance) {
            throw new Error("TxManager is not initialized. Call createInstance() first.");
        }
        return TxManager.instance;
    }

    public async initialize(): Promise<void> {
        super.initialize();
        this.logger.info("initialized");
    }

    public async callContract(
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<string> {
        const txHash = await this.txWriter.callContract(network, params);

        // Transaction monitoring is now handled internally by TxWriter

        return txHash;
    }

    // Transaction Monitoring Methods (Deprecated - handled internally by TxWriter/TxMonitor)
    public async onTxReorg(txHash: string, chainName: string): Promise<string | null> {
        this.logger.warn("onTxReorg is deprecated - transactions are monitored automatically");
        return null;
    }

    public onTxFinality(txHash: string, chainName: string): void {
        this.logger.warn("onTxFinality is deprecated - transactions are monitored automatically");
    }

    // Log Reading Methods
    public async getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]> {
        return this.txReader.getLogs(query, network);
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            network: ConceroNetwork,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
            blockManager: any,
        ): string => {
            return this.txReader.logWatcher.create(
                contractAddress,
                network,
                onLogs,
                event,
                blockManager,
            );
        },
        remove: (watcherId: string): boolean => {
            return this.txReader.logWatcher.remove(watcherId);
        },
    };

    public readContractWatcher = {
        create: (
            contractAddress: Address,
            network: ConceroNetwork,
            functionName: string,
            abi: Abi,
            callback: (result: any, network: ConceroNetwork) => Promise<void>,
            intervalMs?: number,
            args?: any[],
        ): string => {
            return this.txReader.readContractWatcher.create(
                contractAddress,
                network,
                functionName,
                abi,
                callback,
                intervalMs,
                args,
            );
        },
        remove: (watcherId: string): boolean => {
            return this.txReader.readContractWatcher.remove(watcherId);
        },
    };

    // Transaction status methods
    public getPendingTransactions(chainName?: string): any[] {
        // This method is no longer supported - use TxMonitor for transaction tracking
        this.logger.warn(
            "getPendingTransactions is deprecated - use TxMonitor for transaction tracking",
        );
        return [];
    }

    public getTransactionsByMessageId(messageId: string): any[] {
        // This method is no longer relevant for generic transaction management
        this.logger.warn("getTransactionsByMessageId is deprecated in generic TxManager");
        return [];
    }

    public dispose(): void {
        this.txWriter.dispose();
        this.txReader.dispose();
        this.txMonitor.dispose();
        this.logger.info("disposed");
    }
}
