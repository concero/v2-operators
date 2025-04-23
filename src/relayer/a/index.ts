import "../common/utils/configureDotEnv";
import { AppErrorEnum } from "../../constants";
import { AppError, checkGas, logger } from "../common/utils";
import { ensureDeposit } from "./contractCaller/ensureDeposit";
import { ensureOperatorIsRegistered } from "./contractCaller/ensureOperatorIsRegistered";
import { setupEventListeners } from "./eventListener/setupEventListeners";
import { networkManager } from "../common/managers/NetworkManager";
import { deploymentsManager } from "../common/managers/DeploymentManager";
import { rpcManager } from "../common/managers/RpcManager";
import { viemClientManager } from "../common/managers/ViemClientManager";

const globalErrorHandler = (error: Error) => {
    if (error instanceof AppError) {
        if (!error.isOperational) {
            process.exit(1);
        }
    } else {
        const appError = new AppError(AppErrorEnum.UnknownError, error);
        if (!appError.isOperational) {
            process.exit(1);
        }
    }
};

process.on("unhandledRejection", (reason: any) => {
    globalErrorHandler(
        new AppError(
            AppErrorEnum.UnhandledRejection,
            reason instanceof Error ? reason : new Error(String(reason)),
        ),
    );
});

process.on("uncaughtException", (error: Error) => {
    globalErrorHandler(new AppError(AppErrorEnum.UncaughtException, error));
});

async function initializeManagers() {
    try {
        await rpcManager.initialize();
        await networkManager.initialize();
        await deploymentsManager.initialize();
        await viemClientManager.initialize();
    } catch (error) {
        logger.error("Failed to initialize managers", error);
        throw new AppError(
            AppErrorEnum.InitializationError,
            error instanceof Error ? error : new Error(String(error)),
        );
    }
}

async function main() {
    await initializeManagers();

    await checkGas();
    await ensureDeposit();
    await ensureOperatorIsRegistered();
    await setupEventListeners();
}

main().catch(globalErrorHandler);
