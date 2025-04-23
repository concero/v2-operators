import "../common/utils/configureDotEnv";
import { AppErrorEnum } from "../../constants";
import { AppError, checkGas } from "../common/utils";
import { ensureDeposit } from "./contractCaller/ensureDeposit";
import { ensureOperatorIsRegistered } from "./contractCaller/ensureOperatorIsRegistered";
import { setupEventListeners } from "./eventListener/setupEventListeners";
import { initializeManagers } from "../common/managers/initializeManagers";

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

export async function main() {
    await initializeManagers();

    await checkGas();
    await ensureDeposit();
    await ensureOperatorIsRegistered();
    await setupEventListeners();
}

main().catch(globalErrorHandler);
