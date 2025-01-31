import { AppErrorEnum } from "../../constants";
import { AppError, configureDotEnv } from "../common/utils";
import { register } from "./register";

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

async function main() {
    configureDotEnv();
    // checkGas();
    await register();
    // await setupEventListeners(config.POLLING_INTERVAL_MS).then();
}

main();
