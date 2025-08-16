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
    MessagingDeploymentManager,
    RelayerBalanceManager,
    TxManager,
} from '../managers';
import { Relayer } from '../managers/Relayer';

/** Initialize all managers in the correct dependency order */
export async function initializeManagers(): Promise<void> {
    const logger = Logger.createInstance({
        logDir: globalConfig.LOGGER.LOG_DIR,
        logMaxSize: globalConfig.LOGGER.LOG_MAX_SIZE,
        logMaxFiles: globalConfig.LOGGER.LOG_MAX_FILES,
        logLevelDefault: globalConfig.LOGGER.LOG_LEVEL_DEFAULT,
        logLevelsGranular: globalConfig.LOGGER.LOG_LEVELS_GRANULAR,
        enableConsoleTransport: process.env.NODE_ENV !== 'production',
    });
    await logger.initialize();

    const httpLoggerInstance = logger.getLogger('HttpClient');
    const httpClient = HttpClient.createInstance(httpLoggerInstance, {
        retryDelay: globalConfig.HTTPCLIENT.RETRY_DELAY,
        maxRetries: globalConfig.HTTPCLIENT.MAX_RETRIES,
        defaultTimeout: globalConfig.HTTPCLIENT.DEFAULT_TIMEOUT,
    });

    await httpClient.initialize();

    const networkManager = ConceroNetworkManager.createInstance(
        logger.getLogger('NetworkManager'),
        httpClient,
        {
            networkMode: globalConfig.NETWORK_MODE as 'mainnet' | 'testnet' | 'localhost',
            ignoredNetworkIds: globalConfig.IGNORED_NETWORK_IDS,
            whitelistedNetworkIds: globalConfig.WHITELISTED_NETWORK_IDS,
            defaultConfirmations: globalConfig.VIEM.TX_RECEIPT_OPTIONS.confirmations,
            defaultFinalityConfirmations: globalConfig.NETWORK_MANAGER.DEFAULT_FINALITY_CONFIRMATIONS,
            mainnetUrl: globalConfig.URLS.V2_NETWORKS.MAINNET,
            testnetUrl: globalConfig.URLS.V2_NETWORKS.TESTNET,
        },
    );

    // Core infrastructure managers
    const rpcManager = RpcManager.createInstance(logger.getLogger('RpcManager'), networkManager, {
        rpcOverrides: globalConfig.RPC.OVERRIDE,
        rpcExtensions: globalConfig.RPC.EXTENSION,
        conceroRpcsUrl: globalConfig.URLS.CONCERO_RPCS,
        networkMode: globalConfig.NETWORK_MODE as 'mainnet' | 'testnet' | 'localhost',
    });
    const viemClientManager = ViemClientManager.createInstance(
        logger.getLogger('ViemClientManager'),
        rpcManager,
        {
            httpTransportConfig: globalConfig.VIEM.HTTP_TRANSPORT_CONFIG,
            fallbackTransportOptions: globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS,
        },
    );
    const blockCheckpointManager = BlockCheckpointManager.createInstance(
        logger.getLogger('BlockCheckpointManager'),
        {
            useCheckpoints: globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS,
        },
    );

    const blockManagerRegistry = BlockManagerRegistry.createInstance(
        logger.getLogger('BlockManagerRegistry'),
        blockCheckpointManager,
        networkManager,
        viemClientManager,
        rpcManager,
        {
            blockManagerConfig: {
                pollingIntervalMs: globalConfig.BLOCK_MANAGER.POLLING_INTERVAL_MS,
                catchupBatchSize: globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE,
                useCheckpoints: globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS,
            },
        },
    );

    const messagingDeploymentManager = MessagingDeploymentManager.createInstance(
        logger.getLogger('MessagingDeploymentManager'),
        networkManager,
        {
            conceroDeploymentsUrl: globalConfig.URLS.CONCERO_DEPLOYMENTS,
            networkMode: globalConfig.NETWORK_MODE as 'mainnet' | 'testnet' | 'localhost',
        },
    );

    await networkManager.initialize();
    await rpcManager.initialize();
    await messagingDeploymentManager.initialize();
    await viemClientManager.initialize();
    await blockCheckpointManager.initialize();
    await blockManagerRegistry.initialize();

    // Register network update listeners after all managers are initialized
    networkManager.registerUpdateListener(rpcManager);
    networkManager.registerUpdateListener(messagingDeploymentManager);
    networkManager.registerUpdateListener(viemClientManager);
    networkManager.registerUpdateListener(blockManagerRegistry);

    // Trigger initial updates sequentially for all registered listeners
    // This ensures each manager has the data it needs before the next one initializes
    await networkManager.triggerInitialUpdates();

    setInterval(async () => {
        try {
            await networkManager.forceUpdate();
        } catch (error) {
            logger.getLogger('NetworkManager').error('Failed to update networks:', error);
        }
    }, globalConfig.NETWORK_MANAGER.NETWORK_UPDATE_INTERVAL_MS);

    const txMonitor = TxMonitor.createInstance(
        logger.getLogger('TxMonitor'),
        viemClientManager,
        blockManagerRegistry,
        networkManager,
        {},
    );
    const txReader = TxReader.createInstance(
        logger.getLogger('TxReader'),
        networkManager,
        viemClientManager,
        {},
    );

    const nonceManager = NonceManager.createInstance(logger.getLogger('NonceManager'), {});
    await nonceManager.initialize();

    const txWriter = TxWriter.createInstance(
        logger.getLogger('TxWriter'),
        viemClientManager,
        txMonitor,
        nonceManager,
        {
            dryRun: globalConfig.TX_MANAGER.DRY_RUN,
            simulateTx: globalConfig.VIEM.SIMULATE_TX,
            defaultGasLimit: globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT,
            txReceiptOptions: globalConfig.VIEM.TX_RECEIPT_OPTIONS,
        },
    );

    await txWriter.initialize();
    await txReader.initialize();

    const relayerBalanceManager = RelayerBalanceManager.createInstance(
        logger.getLogger('RelayerBalanceManager'),
        viemClientManager,
        txReader,
        {
            defaultMinBalance: globalConfig.BALANCE_MANAGER.DEFAULT_MIN_BALANCE,
            minBalances: globalConfig.BALANCE_MANAGER.MIN_BALANCES,
            pollingIntervalMs: globalConfig.BALANCE_MANAGER.POLLING_INTERVAL_MS,
        },
    );

    const txManager = TxManager.createInstance(
        logger.getLogger('TxManager'),
        networkManager,
        viemClientManager,
        txWriter,
        txReader,
        txMonitor,
        {
            defaultConfirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
        },
    );

    await txManager.initialize();

    relayerBalanceManager.setActiveNetworks(networkManager.getActiveNetworks());
    await relayerBalanceManager.initialize();

    const relayer = Relayer.createInstance(
        logger.getLogger('Relayer'),
        networkManager,
        blockManagerRegistry,
        viemClientManager,
        messagingDeploymentManager,
        txManager,
        txWriter,
        txMonitor,
        relayerBalanceManager,
    );

    await relayer.initialize();
}
