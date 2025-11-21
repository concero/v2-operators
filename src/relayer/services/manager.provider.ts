import {
    BlockManagerRegistry,
    ConceroNetworkManager,
    HttpClient,
    Logger,
    NetworkManager,
    NonceManager,
    RpcManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { EventBusService } from './event-bus.service';
import { PrismaClient } from '@prisma/client';

import { globalConfig } from '../../constants';
import { DbManager, LogsListenerStore, MessagingDeploymentManager } from '../../managers';
import { Config, Context } from '../types';

export abstract class ManagerProvider {
    private config: Config;
    private loggerBuilder!: Logger;
    private eventBus!: EventBusService;
    private networkManager!: NetworkManager;
    private nonceManager!: NonceManager;
    private rpcManager!: RpcManager;
    private dbClient!: PrismaClient;
    private viemClientManager!: ViemClientManager;
    private blockManagerRegistry!: BlockManagerRegistry;
    private messagingDeploymentManager!: MessagingDeploymentManager;
    private logsListenerStore!: LogsListenerStore;
    private txMonitor!: TxMonitor;
    private txReader!: TxReader;
    private txWriter!: TxWriter;
    private httpClient!: HttpClient;

    protected constructor(config: Config) {
        this.config = config;
    }

    protected get context(): Context {
        return {
            logger: this.loggerBuilder,
            config: this.config,
            eventBus: this.eventBus,
            network: this.networkManager,
            rpc: this.rpcManager,
            dbClient: this.dbClient,
            viemClient: this.viemClientManager,
            blockRegistry: this.blockManagerRegistry,
            messagingDeployment: this.messagingDeploymentManager,
            logsListener: this.logsListenerStore,
            txMonitor: this.txMonitor,
            txReader: this.txReader,
            txWriter: this.txWriter,
            http: this.httpClient,
        };
    }

    protected async initManagers() {
        this.loggerBuilder = Logger.createInstance(globalConfig.LOGGER as any);
        this.eventBus = new EventBusService();

        const httpLoggerInstance = this.loggerBuilder.getLogger('HttpClient');
        this.httpClient = HttpClient.createInstance(httpLoggerInstance, globalConfig.HTTPCLIENT);

        await this.httpClient.initialize();

        this.networkManager = ConceroNetworkManager.createInstance(
            this.loggerBuilder.getLogger('NetworkManager'),
            this.httpClient,
            globalConfig.NETWORK_MANAGER,
        );

        this.dbClient = DbManager.getClient();

        this.logsListenerStore = new LogsListenerStore(
            this.loggerBuilder.getLogger('LogsListenerBlockCheckpointStore'),
            this.dbClient,
        );

        // Core infrastructure managers
        this.rpcManager = RpcManager.createInstance(
            this.loggerBuilder.getLogger('RpcManager'),
            this.networkManager,
            globalConfig.RPC_MANAGER,
        );
        this.viemClientManager = ViemClientManager.createInstance(
            this.loggerBuilder.getLogger('ViemClientManager'),
            this.rpcManager,
            globalConfig.VIEM_CLIENT_MANAGER,
        );
        this.blockManagerRegistry = BlockManagerRegistry.createInstance(
            globalConfig.BLOCK_MANAGER,
            this.loggerBuilder.getLogger('BlockManagerRegistry'),
            this.networkManager,
            this.viemClientManager,
        );
        this.messagingDeploymentManager = MessagingDeploymentManager.createInstance(
            this.loggerBuilder.getLogger('MessagingDeploymentManager'),
            this.networkManager,
            globalConfig.DEPLOYMENT_MANAGER,
        );

        await this.networkManager.initialize();
        await this.rpcManager.initialize();
        await this.messagingDeploymentManager.initialize();
        await this.viemClientManager.initialize();
        await this.blockManagerRegistry.initialize();

        // Register network update listeners after all managers are initialized
        this.networkManager.registerUpdateListener(this.rpcManager);
        this.networkManager.registerUpdateListener(this.messagingDeploymentManager);
        this.networkManager.registerUpdateListener(this.viemClientManager);
        this.networkManager.registerUpdateListener(this.blockManagerRegistry);

        // Start polling for network updates which will also trigger initial updates
        await this.networkManager.startPolling();

        this.txMonitor = TxMonitor.createInstance(
            this.loggerBuilder.getLogger('TxMonitor'),
            this.viemClientManager,
            this.blockManagerRegistry,
            this.networkManager,
            globalConfig.TX_MONITOR,
        );
        this.txReader = TxReader.createInstance(
            globalConfig.TX_READER,
            this.loggerBuilder.getLogger('TxReader'),
            this.viemClientManager,
            this.logsListenerStore,
        );

        this.nonceManager = NonceManager.createInstance(
            this.loggerBuilder.getLogger('NonceManager'),
            this.viemClientManager,
            {},
        );
        await this.nonceManager.initialize();

        this.txWriter = TxWriter.createInstance(
            this.loggerBuilder.getLogger('TxWriter'),
            this.viemClientManager,
            this.txMonitor,
            this.nonceManager,
            globalConfig.TX_WRITER,
        );

        await this.txWriter.initialize();
        await this.txReader.initialize();
    }
}
