import { rpcManager } from "./RpcManager";
import { networkManager } from "./NetworkManager";
import { deploymentsManager } from "./DeploymentManager";
import { viemClientManager } from "./ViemClientManager";
import { blockCheckpointManager } from "./BlockCheckpointManager";
import { AppError, logger } from "../utils";
import { AppErrorEnum } from "../../../constants";

export async function initializeManagers() {
    try {
        await rpcManager.initialize();
        await networkManager.initialize();
        await deploymentsManager.initialize();
        await viemClientManager.initialize();
        await blockCheckpointManager.initialize();
    } catch (error) {
        logger.error("Failed to initialize managers", error);
        throw new AppError(
            AppErrorEnum.InitializationError,
            error instanceof Error ? error : new Error(String(error)),
        );
    }
}
