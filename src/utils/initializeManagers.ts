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

import { globalConfig } from '../constants';
import {
    BlockCheckpointManager,
    DbManager,
    MessagingDeploymentManager,
    RelayerBalanceManager,
} from '../managers';
import { Relayer } from '../managers/Relayer';

/** Initialize all managers in the correct dependency order */
export async function initializeManagers() {
    const logger = Logger.createInstance(globalConfig.LOGGER);

    const httpLoggerInstance = logger.getLogger('HttpClient');
    const httpClient = HttpClient.createInstance(httpLoggerInstance, globalConfig.HTTPCLIENT);

    await httpClient.initialize();

    const networkManager = ConceroNetworkManager.createInstance(
        logger.getLogger('NetworkManager'),
        httpClient,
        globalConfig.NETWORK_MANAGER,
    );

    const dbClient = DbManager.getClient();

    // Core infrastructure managers
    const rpcManager = RpcManager.createInstance(
        logger.getLogger('RpcManager'),
        networkManager,
        globalConfig.RPC_MANAGER,
    );

    const viemClientManager = ViemClientManager.createInstance(
        logger.getLogger('ViemClientManager'),
        rpcManager,
        globalConfig.VIEM_CLIENT_MANAGER,
    );

    const blockCheckpointManager = new BlockCheckpointManager(
        logger.getLogger('BlockCheckpointManager'),
        dbClient,
        globalConfig.BLOCK_MANAGER,
    );

    const blockManagerRegistry = BlockManagerRegistry.createInstance(
        logger.getLogger('BlockManagerRegistry'),
        networkManager,
        viemClientManager,
        globalConfig.BLOCK_MANAGER,
    );

    const messagingDeploymentManager = MessagingDeploymentManager.createInstance(
        logger.getLogger('MessagingDeploymentManager'),
        networkManager,
        globalConfig.DEPLOYMENT_MANAGER,
    );

    await networkManager.initialize();
    await rpcManager.initialize();
    await messagingDeploymentManager.initialize();
    await viemClientManager.initialize();
    await blockManagerRegistry.initialize();

    // Register network update listeners after all managers are initialized
    networkManager.registerUpdateListener(rpcManager);
    networkManager.registerUpdateListener(messagingDeploymentManager);
    networkManager.registerUpdateListener(viemClientManager);
    networkManager.registerUpdateListener(blockManagerRegistry);

    // Start polling for network updates which will also trigger initial updates
    await networkManager.startPolling();

    const txMonitor = TxMonitor.createInstance(
        logger.getLogger('TxMonitor'),
        viemClientManager,
        blockManagerRegistry,
        networkManager,
        globalConfig.TX_MONITOR,
    );
    const txReader = TxReader.createInstance(
        logger.getLogger('TxReader'),
        viemClientManager,
        globalConfig.TX_READER,
    );

    const nonceManager = NonceManager.createInstance(
        logger.getLogger('NonceManager'),
        viemClientManager,
        {},
    );
    await nonceManager.initialize();

    const txWriter = TxWriter.createInstance(
        logger.getLogger('TxWriter'),
        viemClientManager,
        txMonitor,
        nonceManager,
        globalConfig.TX_WRITER,
    );

    await txWriter.initialize();
    await txReader.initialize();

    const relayerBalanceManager = RelayerBalanceManager.createInstance(
        logger.getLogger('RelayerBalanceManager'),
        viemClientManager,
        txReader,
        globalConfig.BALANCE_MANAGER,
    );

    relayerBalanceManager.setActiveNetworks(networkManager.getActiveNetworks());
    await relayerBalanceManager.initialize();

    const relayer = Relayer.createInstance(
        logger.getLogger('Relayer'),
        networkManager,
        blockManagerRegistry,
        viemClientManager,
        messagingDeploymentManager,
        txReader,
        txWriter,
        txMonitor,
        globalConfig.RELAYER,
    );

    await relayer.initialize();
}
