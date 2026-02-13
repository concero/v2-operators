import {
    BlockManagerRegistry,
    ConceroNetworkManager,
    HttpClient,
    Logger,
    NonceManager,
    RpcManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { JobQueueService } from './job-queue.service';
import { PrismaClient } from '@prisma/client';

import { globalConfig } from '../../constants';
import { DbManager, LogsListenerStore, RelayerBalanceManager } from '../../managers';
import { ChainManager } from '../../managers/chain-manager';
import { Config } from '../../types';
import { Context } from '../types';

export abstract class ManagerProvider {
    private config: Config;
    private loggerBuilder!: Logger;
    private networkManager!: ConceroNetworkManager;
    private nonceManager!: NonceManager;
    private rpcManager!: RpcManager;
    private dbClient!: PrismaClient;
    private viemClientManager!: ViemClientManager;
    private blockManagerRegistry!: BlockManagerRegistry;
    private logsListenerStore!: LogsListenerStore;
    private txMonitor!: TxMonitor;
    private txReader!: TxReader;
    private txWriter!: TxWriter;
    private httpClient!: HttpClient;
    private jobQueueService!: JobQueueService;
    private balanceManager!: RelayerBalanceManager;
    private chainsManager!: ChainManager;

    protected constructor(config: Config) {
        this.config = config;
    }

    protected get context(): Context {
        return {
            logger: this.loggerBuilder,
            config: this.config,
            network: this.networkManager,
            rpc: this.rpcManager,
            dbClient: this.dbClient,
            viemClient: this.viemClientManager,
            blockRegistry: this.blockManagerRegistry,
            logsListener: this.logsListenerStore,
            txMonitor: this.txMonitor,
            jobQueue: this.jobQueueService,
            txReader: this.txReader,
            txWriter: this.txWriter,
            http: this.httpClient,
            balanceManager: this.balanceManager,
            chainsManager: this.chainsManager,
        };
    }

    protected async initManagers() {
        this.loggerBuilder = Logger.createInstance(globalConfig.LOGGER as any);

        this.httpClient = HttpClient.createInstance(
            this.loggerBuilder.getLogger('HttpClient'),
            globalConfig.HTTPCLIENT,
        );

        await this.httpClient.initialize();

        this.networkManager = ConceroNetworkManager.createInstance(
            this.loggerBuilder.getLogger('NetworkManager'),
            this.httpClient,
            globalConfig.NETWORK_MANAGER,
        );
        this.chainsManager = new ChainManager(
            this.loggerBuilder.getLogger('ChainsManager'),
            this.httpClient,
            60 * 1000 * 60,
        );
        await this.chainsManager.initialize();

        this.dbClient = DbManager.getClient();
        await this.dbClient.$connect();
        this.jobQueueService = new JobQueueService(
            this.loggerBuilder.getLogger('JobQueueService'),
            this.dbClient,
        );
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

        await this.rpcManager.initialize();
        await this.viemClientManager.initialize();
        await this.blockManagerRegistry.initialize();

        this.balanceManager = new RelayerBalanceManager(this.viemClientManager);

        // Register network update listeners after all managers are initialized
        this.chainsManager.registerListener(this.rpcManager);
        this.chainsManager.registerListener(this.viemClientManager);
        this.chainsManager.registerListener(this.blockManagerRegistry);
        this.chainsManager.registerListener(this.balanceManager);

        // Start polling for network updates which will also trigger initial updates
        await this.chainsManager.startPolling();
        this.blockManagerRegistry.startPolling();

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
            // @todo: implement "increment" method
            this.nonceManager as any,
            globalConfig.TX_WRITER,
        );

        await this.txWriter.initialize();
        await this.txReader.initialize();

        await this.balanceManager.startPolling();
    }
}
