import { configureDotEnv } from "../common/utils/dotenvConfig";
import { setupEventListeners } from "./eventListener/setupEventListeners";
import { config } from "./constants/config";
import { AppError } from "../common/utils/AppError";

const globalErrorHandler = (error: Error) => {
    if (error instanceof AppError) {
        if (!error.isOperational) {
            process.exit(1);
        }
    } else {
        const appError = new AppError("UnknownError", error);
        if (!appError.isOperational) {
            process.exit(1);
        }
    }
};

process.on("unhandledRejection", (reason: any) => {
    globalErrorHandler(
        new AppError("UnhandledRejection", reason instanceof Error ? reason : new Error(String(reason))),
    );
});

process.on("uncaughtException", (error: Error) => {
    globalErrorHandler(new AppError("UncaughtException", error));
});

function main() {
    configureDotEnv();
    setupEventListeners(config.POLLING_INTERVAL_MS).then();
}

main();
