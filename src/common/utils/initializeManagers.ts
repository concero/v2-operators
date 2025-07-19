import {
    BlockCheckpointManager,
    BlockManagerRegistry,
    DeploymentManager,
    NetworkManager,
    NonceManager,
    RpcManager,
    TxManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from "../managers";

import { globalConfig } from "../../constants";
import {
    BlockCheckpointManagerConfig,
    BlockManagerConfig,
    BlockManagerRegistryConfig,
    DeploymentManagerConfig,
    NetworkManagerConfig,
    NonceManagerConfig,
    RpcManagerConfig,
    TxManagerConfig,
    TxMonitorConfig,
    TxReaderConfig,
    TxWriterConfig,
    ViemClientManagerConfig,
} from "../../types/ManagerConfigs";
import { HttpClient } from "./HttpClient";
import { Logger } from "./Logger";

/** Initialize all managers in the correct dependency order */
export async function initializeManagers(): Promise<void> {
    const logger = Logger.createInstance({
        logDir: globalConfig.LOGGER.LOG_DIR,
        logMaxSize: globalConfig.LOGGER.LOG_MAX_SIZE,
        logMaxFiles: globalConfig.LOGGER.LOG_MAX_FILES,
        logLevelDefault: globalConfig.LOGGER.LOG_LEVEL_DEFAULT,
        logLevelsGranular: globalConfig.LOGGER.LOG_LEVELS_GRANULAR,
    });
    await logger.initialize();

    const httpLoggerInstance = logger.getLogger("HttpClient");
    const httpClient = HttpClient.createInstance(httpLoggerInstance, {
        retryDelay: globalConfig.HTTPCLIENT.RETRY_DELAY,
        maxRetries: globalConfig.HTTPCLIENT.MAX_RETRIES,
        defaultTimeout: globalConfig.HTTPCLIENT.DEFAULT_TIMEOUT,
    });

    await httpClient.initialize();

    const blockCheckpointManagerConfig: BlockCheckpointManagerConfig = {
        useCheckpoints: globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS,
    };

    const blockManagerConfig: BlockManagerConfig = {
        pollingIntervalMs: globalConfig.BLOCK_MANAGER.POLLING_INTERVAL_MS,
        catchupBatchSize: globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE,
        useCheckpoints: globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS,
    };

    const blockManagerRegistryConfig: BlockManagerRegistryConfig = {
        blockManagerConfig,
    };

    const rpcManagerConfig: RpcManagerConfig = {
        rpcOverrides: globalConfig.RPC.OVERRIDE,
        rpcExtensions: globalConfig.RPC.EXTENSION,
        conceroRpcsUrl: globalConfig.URLS.CONCERO_RPCS,
        networkMode: globalConfig.NETWORK_MODE as "mainnet" | "testnet" | "localhost",
    };

    const viemClientManagerConfig: ViemClientManagerConfig = {
        fallbackTransportOptions: globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS,
    };

    const deploymentManagerConfig: DeploymentManagerConfig = {
        conceroDeploymentsUrl: globalConfig.URLS.CONCERO_DEPLOYMENTS,
        networkMode: globalConfig.NETWORK_MODE as "mainnet" | "testnet" | "localhost",
    };

    const networkManagerConfig: NetworkManagerConfig = {
        networkUpdateIntervalMs: globalConfig.NETWORK_MANAGER.NETWORK_UPDATE_INTERVAL_MS,
        networkMode: globalConfig.NETWORK_MODE as "mainnet" | "testnet" | "localhost",
        ignoredNetworkIds: globalConfig.IGNORED_NETWORK_IDS,
        whitelistedNetworkIds: globalConfig.WHITELISTED_NETWORK_IDS,
        defaultConfirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
    };

    const txWriterConfig: TxWriterConfig = {
        dryRun: globalConfig.TX_MANAGER.DRY_RUN,
    };

    const txReaderConfig: TxReaderConfig = {};
    const txMonitorConfig: TxMonitorConfig = {};

    const txManagerConfig: TxManagerConfig = {
        defaultConfirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
    };

    const nonceManagerConfig: NonceManagerConfig = {};

    // Core infrastructure managers
    const rpcManager = RpcManager.createInstance(logger.getLogger("RpcManager"), rpcManagerConfig);
    const viemClientManager = ViemClientManager.createInstance(
        logger.getLogger("ViemClientManager"),
        rpcManager,
        viemClientManagerConfig,
    );
    const deploymentManager = DeploymentManager.createInstance(
        logger.getLogger("DeploymentManager"),
        deploymentManagerConfig,
    );
    const networkManager = NetworkManager.createInstance(
        logger.getLogger("NetworkManager"),
        networkManagerConfig,
    );
    const blockCheckpointManager = BlockCheckpointManager.createInstance(
        logger.getLogger("BlockCheckpointManager"),
        blockCheckpointManagerConfig,
    );

    const blockManagerRegistry = BlockManagerRegistry.createInstance(
        logger.getLogger("BlockManagerRegistry"),
        blockCheckpointManager,
        networkManager,
        viemClientManager,
        rpcManager,
        blockManagerRegistryConfig,
    );

    await networkManager.initialize();
    await rpcManager.initialize();
    await viemClientManager.initialize();
    await deploymentManager.initialize();

    // Register network update listeners after all managers are initialized
    networkManager.registerUpdateListener(rpcManager);
    networkManager.registerUpdateListener(deploymentManager);
    networkManager.registerUpdateListener(viemClientManager);
    networkManager.registerUpdateListener(blockManagerRegistry);

    await blockCheckpointManager.initialize();
    await blockManagerRegistry.initialize();
    const txWriter = TxWriter.createInstance(
        logger.getLogger("TxWriter"),
        networkManager,
        viemClientManager,
        txWriterConfig,
    );
    const txReader = TxReader.createInstance(
        logger.getLogger("TxReader"),
        networkManager,
        viemClientManager,
        blockManagerRegistry,
        txReaderConfig,
    );

    await txWriter.initialize();
    await txReader.initialize();

    const txMonitor = TxMonitor.createInstance(
        logger.getLogger("TxMonitor"),
        viemClientManager,
        (txHash, chainName) => txWriter.onTxFinality(txHash, chainName),
        (txHash, chainName) => txWriter.onTxReorg(txHash, chainName),
        txMonitorConfig,
    );

    const txManager = TxManager.createInstance(
        logger.getLogger("TxManager"),
        networkManager,
        viemClientManager,
        blockManagerRegistry,
        txWriter,
        txReader,
        txMonitor,
        txManagerConfig,
    );

    await txManager.initialize();

    const nonceManager = NonceManager.createInstance(
        logger.getLogger("NonceManager"),
        nonceManagerConfig,
    );
    await nonceManager.initialize();
}
