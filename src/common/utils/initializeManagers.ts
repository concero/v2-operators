import { BlockCheckpointManager } from "../managers/BlockCheckpointManager";
import { BlockManagerRegistry } from "../managers/BlockManagerRegistry";
import { DeploymentManager } from "../managers/DeploymentManager";
import { NetworkManager } from "../managers/NetworkManager";
import { RpcManager } from "../managers/RpcManager";
import { TxManager } from "../managers/TxManager";
import { ViemClientManager } from "../managers/ViemClientManager";

import { logger } from "./logger";

/** Initialize all managers in the correct dependency order */
export async function initializeManagers(): Promise<void> {
    try {
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

        const txManager = TxManager.createInstance(
            networkManager,
            viemClientManager,
            blockManagerRegistry,
        );

        // Initialize all managers in proper dependency order
        await rpcManager.initialize();
        await viemClientManager.initialize();
        await deploymentManager.initialize();
        await networkManager.initialize();
        await blockCheckpointManager.initialize();
        await blockManagerRegistry.initialize();
        await txManager.initialize();
    } catch (error) {
        logger.error("[Managers]: Failed to initialize managers", error);
        throw new Error(
            `Manager initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}
