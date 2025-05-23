import { AbiEvent, Address, PublicClient, SimulateContractParameters, WalletClient } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxManager } from "../../types/managers/ITxManager";
import { ITxMonitor } from "../../types/managers/ITxMonitor";
import { ITxReader, LogQuery, LogResult } from "../../types/managers/ITxReader";
import { ITxWriter, ManagedTx, TxSubmissionParams } from "../../types/managers/ITxWriter";
import { Logger, LoggerInterface } from "../utils/logger";

import { BlockManagerRegistry } from "./BlockManagerRegistry";
import { ManagerBase } from "./ManagerBase";
import { NetworkManager } from "./NetworkManager";
import { TxMonitor } from "./TxMonitor";
import { TxReader } from "./TxReader";
import { TxWriter } from "./TxWriter";
import { ViemClientManager } from "./ViemClientManager";

export class TxManager extends ManagerBase implements ITxManager {
    private static instance: TxManager | undefined;

    private readonly txWriter: ITxWriter;
    private readonly txReader: ITxReader;
    private readonly txMonitor: ITxMonitor;
    private readonly networkManager: NetworkManager;
    private readonly viemClientManager: ViemClientManager;
    private readonly blockManagerRegistry: BlockManagerRegistry;
    private logger: LoggerInterface;

    private constructor(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
        txWriter: ITxWriter,
        txReader: ITxReader,
        txMonitor: ITxMonitor,
    ) {
        super();
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
        this.txWriter = txWriter;
        this.txReader = txReader;
        this.txMonitor = txMonitor;
        this.logger = Logger.getInstance().getLogger("TxManager");
    }

    public static createInstance(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
        txWriter: ITxWriter,
        txReader: ITxReader,
        txMonitor: ITxMonitor,
    ): TxManager {
        if (!TxManager.instance) {
            TxManager.instance = new TxManager(
                networkManager,
                viemClientManager,
                blockManagerRegistry,
                txWriter,
                txReader,
                txMonitor,
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
        params: SimulateContractParameters,
    ): Promise<ManagedTx> {
        const managedTx = await this.txWriter.callContract(walletClient, publicClient, params);

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
    public async getLogs(query: LogQuery, network: ConceroNetwork): Promise<LogResult[]> {
        return this.txReader.getLogs(query, network);
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>,
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
