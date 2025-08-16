import { ManagerBase } from './ManagerBase';
import { ITxMonitor, ITxReader, ITxWriter, LogQuery, LoggerInterface } from '@concero/operator-utils';
import { Abi, AbiEvent, Address, Log, SimulateContractParameters } from 'viem';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { TxManagerConfig } from '../types/ManagerConfigs';
import { INetworkManager, ITxManager, IViemClientManager } from '../types/managers';
export declare class TxManager extends ManagerBase implements ITxManager {
    private static instance;
    private readonly txWriter;
    private readonly txReader;
    private readonly txMonitor;
    private readonly networkManager;
    private readonly viemClientManager;
    private logger;
    private config;
    private constructor();
    static createInstance(logger: LoggerInterface, networkManager: INetworkManager, viemClientManager: IViemClientManager, txWriter: ITxWriter, txReader: ITxReader, txMonitor: ITxMonitor, config: TxManagerConfig): TxManager;
    static getInstance(): TxManager;
    initialize(): Promise<void>;
    callContract(network: ConceroNetwork, params: SimulateContractParameters): Promise<string>;
    onTxReorg(txHash: string, chainName: string): Promise<string | null>;
    onTxFinality(txHash: string, chainName: string): void;
    getLogs(query: LogQuery, network: ConceroNetwork): Promise<Log[]>;
    logWatcher: {
        create: (contractAddress: Address, network: ConceroNetwork, onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>, event: AbiEvent, blockManager: any) => string;
        remove: (watcherId: string) => boolean;
    };
    readContractWatcher: {
        create: (contractAddress: Address, network: ConceroNetwork, functionName: string, abi: Abi, callback: (result: any, network: ConceroNetwork) => Promise<void>, intervalMs?: number, args?: any[]) => string;
        remove: (watcherId: string) => boolean;
    };
    getPendingTransactions(chainName?: string): any[];
    getTransactionsByMessageId(messageId: string): any[];
    dispose(): void;
}
//# sourceMappingURL=TxManager.d.ts.map