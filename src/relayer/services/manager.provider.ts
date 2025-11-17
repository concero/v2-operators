import { EventEmitter } from 'node:events';
import { Address } from 'viem';
import {
    BlockManagerRegistry,
    ConceroNetwork,
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
import { PrismaClient } from '@prisma/client';

import { globalConfig } from '../../constants';
import { DbManager, LogsListenerStore, MessagingDeploymentManager } from '../../managers';
import { Config, Context } from '../types';

export abstract class ManagerProvider {
    private readonly config: Config;
    private readonly loggerBuilder: Logger;
    private readonly eventEmitter;
    private readonly networkManager: NetworkManager;
    private readonly nonceManager: NonceManager;
    private readonly rpcManager: RpcManager;
    private readonly dbClient: PrismaClient;
    private readonly viemClientManager: ViemClientManager;
    private readonly blockManagerRegistry: BlockManagerRegistry;
    private readonly messagingDeploymentManager: MessagingDeploymentManager;
    private readonly logsListenerStore: LogsListenerStore;
    private readonly txMonitor: TxMonitor;
    private readonly txReader: TxReader;
    private readonly txWriter: TxWriter;
    private readonly verifierNetwork: ConceroNetwork;
    private verifierAddress: Address = '0x0';

    protected constructor(config: Config) {
        this.loggerBuilder = Logger.createInstance(globalConfig.LOGGER as any);
        this.config = config;
        this.eventEmitter = new EventEmitter();

        const httpLoggerInstance = this.loggerBuilder.getLogger('HttpClient');
        const httpClient = HttpClient.createInstance(httpLoggerInstance, globalConfig.HTTPCLIENT);

        void httpClient.initialize();

        this.networkManager = ConceroNetworkManager.createInstance(
            this.loggerBuilder.getLogger('NetworkManager'),
            httpClient,
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

        this.txWriter = TxWriter.createInstance(
            this.loggerBuilder.getLogger('TxWriter'),
            this.viemClientManager,
            this.txMonitor,
            this.nonceManager,
            globalConfig.TX_WRITER,
        );

        this.verifierNetwork = this.networkManager.getVerifierNetwork() as ConceroNetwork;
        this.messagingDeploymentManager
            .getConceroVerifier()
            .then(address => (this.verifierAddress = address));
    }

    protected get context(): Context {
        return {
            logger: this.loggerBuilder,
            config: this.config,
            eventEmitter: this.eventEmitter,
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
            verifierNetwork: this.verifierNetwork,
            verifierAddress: this.verifierAddress,
        };
    }

    protected async initialize() {
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
        await this.nonceManager.initialize();

        await this.txWriter.initialize();
        await this.txReader.initialize();
    }
}
