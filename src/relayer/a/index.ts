import "../common/utils/configureDotEnv";
import { AppErrorEnum } from "../../constants";
import { AppError, checkGas } from "../common/utils";
import { ensureDeposit } from "./contractCaller/ensureDeposit";
import { ensureOperatorIsRegistered } from "./contractCaller/ensureOperatorIsRegistered";
import { setupEventListeners } from "./eventListener/setupEventListeners";

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
    console.log("\n\nreason: ", reason);
    globalErrorHandler(
        new AppError(
            AppErrorEnum.UnhandledRejection,
            reason instanceof Error ? reason : new Error(String(reason)),
        ),
    );
});

process.on("uncaughtException", (error: Error) => {
    console.log("\n\n\nerror: ", error);

    globalErrorHandler(new AppError(AppErrorEnum.UncaughtException, error));
});

async function main() {
    await checkGas();
    await ensureDeposit();
    await ensureOperatorIsRegistered();
    await setupEventListeners();
}

main();
