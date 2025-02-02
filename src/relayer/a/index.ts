import { AppErrorEnum } from "../../constants";
import { AppError, checkGas, configureDotEnv } from "../common/utils";
import { makeDeposit } from "./contractCaller/makeDeposit";
import { registerOperator } from "./contractCaller/registerOperator";

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
    await checkGas();
    await makeDeposit();
    await registerOperator();
    // await setupEventListeners(config.POLLING_INTERVAL_MS).then();
}

main();
