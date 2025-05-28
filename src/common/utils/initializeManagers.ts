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

import { HttpClient } from "./httpClient";
import { Logger } from "./logger";

/** Initialize all managers in the correct dependency order */
export async function initializeManagers(): Promise<void> {
    const logger = Logger.createInstance();
    await logger.initialize();

    const httpClient = HttpClient.getInstance();
    const httpQueue = HttpClient.getQueueInstance();
    httpClient.initialize();
    httpQueue.initialize();

    // Core infrastructure managers
    const rpcManager = RpcManager.createInstance();
    const viemClientManager = ViemClientManager.createInstance(rpcManager);
    const deploymentManager = DeploymentManager.createInstance();
    const networkManager = NetworkManager.createInstance(rpcManager, deploymentManager);
    const blockCheckpointManager = BlockCheckpointManager.createInstance();

    const blockManagerRegistry = BlockManagerRegistry.createInstance(
        blockCheckpointManager,
        networkManager,
        viemClientManager,
        rpcManager,
    );

    await rpcManager.initialize();
    await viemClientManager.initialize();
    await deploymentManager.initialize();
    await networkManager.initialize();
    await blockCheckpointManager.initialize();
    await blockManagerRegistry.initialize();

    const txWriter = TxWriter.createInstance(networkManager, viemClientManager);
    const txReader = TxReader.createInstance(
        networkManager,
        viemClientManager,
        blockManagerRegistry,
    );

    await txWriter.initialize();
    await txReader.initialize();

    const txMonitor = TxMonitor.createInstance(
        viemClientManager,
        (txHash, chainName) => txWriter.onTxFinality(txHash, chainName),
        (txHash, chainName) => txWriter.onTxReorg(txHash, chainName),
    );

    const txManager = TxManager.createInstance(
        networkManager,
        viemClientManager,
        blockManagerRegistry,
        txWriter,
        txReader,
        txMonitor,
    );

    await txManager.initialize();

    const nonceManager = NonceManager.createInstance();
    await nonceManager.initialize();
}
