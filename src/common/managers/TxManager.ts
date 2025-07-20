import {
    AbiEvent,
    Address,
    Log,
    PublicClient,
    SimulateContractParameters,
    WalletClient,
} from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxManagerConfig } from "../../types/ManagerConfigs";
import {
    IBlockManagerRegistry,
    INetworkManager,
    ITxManager,
    ITxMonitor,
    IViemClientManager,
} from "../../types/managers";
import { ITxReader, LogQuery } from "../../types/managers/ITxReader";
import { ITxWriter, ManagedTx } from "../../types/managers/ITxWriter";
import { LoggerInterface } from "../utils/";

import { ManagerBase } from "./ManagerBase";

// High-level interface for both reading & writing to the network
export class TxManager extends ManagerBase implements ITxManager {
    private static instance: TxManager | undefined;

    private readonly txWriter: ITxWriter;
    private readonly txReader: ITxReader;
    private readonly txMonitor: ITxMonitor;
    private readonly networkManager: INetworkManager;
    private readonly viemClientManager: IViemClientManager;
    private readonly blockManagerRegistry: IBlockManagerRegistry;
    private logger: LoggerInterface;
    private config: TxManagerConfig;

    private constructor(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        blockManagerRegistry: IBlockManagerRegistry,
        txWriter: ITxWriter,
        txReader: ITxReader,
        txMonitor: ITxMonitor,
        config: TxManagerConfig,
    ) {
        super();
        this.logger = logger;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
        this.txWriter = txWriter;
        this.txReader = txReader;
        this.txMonitor = txMonitor;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: INetworkManager,
        viemClientManager: IViemClientManager,
        blockManagerRegistry: IBlockManagerRegistry,
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
                blockManagerRegistry,
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
        walletClient: WalletClient,
        publicClient: PublicClient,
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<ManagedTx> {
        const managedTx = await this.txWriter.callContract(
            walletClient,
            publicClient,
            network,
            params,
        );

        this.txMonitor.addTransaction(managedTx.txHash, managedTx);

        return managedTx;
    }

    // Transaction Monitoring Methods
    public async onTxReorg(txHash: string, chainName: string): Promise<string | null> {
        return this.txWriter.onTxReorg(txHash, chainName);
    }

    public onTxFinality(txHash: string, chainName: string): void {
        this.txWriter.onTxFinality(txHash, chainName);
    }

    // Log Reading Methods
    public async getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]> {
        return this.txReader.getLogs(query, network);
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>,
            event: AbiEvent,
        ): string => {
            return this.txReader.logWatcher.create(contractAddress, chainName, onLogs, event);
        },
        remove: (watcherId: string): boolean => {
            return this.txReader.logWatcher.remove(watcherId);
        },
    };

    // Transaction status methods
    public getPendingTransactions(chainName?: string): ManagedTx[] {
        return this.txWriter.getPendingTransactions(chainName);
    }

    public getTransactionsByMessageId(messageId: string): ManagedTx[] {
        return this.txWriter.getTransactionsByMessageId(messageId);
    }

    public dispose(): void {
        this.txWriter.dispose();
        this.txReader.dispose();
        this.txMonitor.dispose();
        this.logger.info("disposed");
    }
}
