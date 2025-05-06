import "../common/utils/configureDotEnv";

import { AppErrorEnum } from "../../constants";
import { AppError, checkGas } from "../common/utils";
import { ensureDeposit } from "./contractCaller/ensureDeposit";
import { ensureOperatorIsRegistered } from "./contractCaller/ensureOperatorIsRegistered";
import { setupEventListeners } from "./eventListener/setupEventListeners";
import { initializeManagers } from "../common/managers/initializeManagers";
import { blockCheckpointManager } from "../common/managers/BlockCheckpointManager";

const globalErrorHandler = (error: Error) => {
    if (error instanceof AppError) {
        if (!error.isOperational) {
            saveCheckpointsAndExit(1);
        }
    } else {
        const appError = new AppError(AppErrorEnum.UnknownError, error);
        if (!appError.isOperational) {
            saveCheckpointsAndExit(1);
        }
    }
};

async function saveCheckpointsAndExit(code: number) {
    try {
        await blockCheckpointManager.saveCheckpoints();
    } catch (error) {
        console.error("Failed to save checkpoints during exit:", error);
    } finally {
        process.exit(code);
    }
}

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

process.on("SIGINT", () => saveCheckpointsAndExit(0));
process.on("SIGTERM", () => saveCheckpointsAndExit(0));

export async function main() {
    await initializeManagers();

    await checkGas();
    await ensureDeposit();
    await ensureOperatorIsRegistered();
    await setupEventListeners();
}

main().catch(globalErrorHandler);
