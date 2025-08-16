import { MessagingDeploymentManager, RelayerBalanceManager, TxManager } from './index';
import { BlockManagerRegistry, ITxMonitor, LoggerInterface, NetworkManager, TxWriter, ViemClientManager } from '@concero/operator-utils';
export declare class Relayer {
    private static instance;
    private readonly logger;
    private readonly networkManager;
    private readonly blockManagerRegistry;
    private readonly viemClientManager;
    private readonly deploymentManager;
    private readonly txManager;
    private readonly txWriter;
    private readonly txMonitor;
    private readonly balanceManager;
    private readonly setup;
    private eventListenerHandles;
    private isDisposed;
    private sourceChainFinalityMap;
    private destinationChainFinalityMap;
    private constructor();
    static createInstance(logger: LoggerInterface, networkManager: NetworkManager, blockManagerRegistry: BlockManagerRegistry, viemClientManager: ViemClientManager, deploymentManager: MessagingDeploymentManager, txManager: TxManager, txWriter: TxWriter, txMonitor: ITxMonitor, balanceManager: RelayerBalanceManager): Relayer;
    static getInstance(): Relayer;
    initialize(): Promise<void>;
    private setupEventListeners;
    private handleConceroMessageSent;
    private handleMessageReport;
    private processMessageReportRequest;
    private processMessageReportSubmission;
    private parseMessageResults;
    private groupMessagesByDestination;
    private fetchOriginalMessage;
    private submitBatchToDestination;
    private addFinalityTracking;
    private onFinalityCallback;
    private retryDestinationSubmission;
    dispose(): void;
}
//# sourceMappingURL=Relayer.d.ts.map