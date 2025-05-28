import "../common/utils/configureDotEnv";

import { BlockManagerRegistry } from "../common/managers";
import { AppError } from "../common/utils";
import { initializeManagers } from "../common/utils/initializeManagers";
import { AppErrorEnum } from "../constants";

import { setupEventListeners } from "./eventListener/setupEventListeners";

const globalErrorHandler = (error: Error) => {
    if (error instanceof AppError) {
        if (!error.isOperational) {
        }
    } else {
        const appError = new AppError(AppErrorEnum.UnknownError, error);
        if (!appError.isOperational) {
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

export async function main() {
    await initializeManagers();

    // await checkGas();
    // await ensureDeposit();
    // await ensureOperatorIsRegistered();
    await setupEventListeners();

    const blockManagerRegistry = BlockManagerRegistry.getInstance();
    for (const blockManager of blockManagerRegistry.getAllBlockManagers()) {
        await blockManager.startPolling();
    }
}

main().catch(globalErrorHandler);
