import './utils/configureDotEnv';

import { AppErrorEnum, globalConfig, messageSentEventAbi, routerContractAbi } from './constants';
import { RelayerApp } from './relayer';
import { AppError, startHeapSnapshotCollection } from './utils';

const globalErrorHandler = (error: Error) => {
    if (error instanceof AppError) {
        if (!error.isOperational) {
            // @todo: add handler
        }
    } else {
        const appError = new AppError(AppErrorEnum.UnknownError, error);
        if (!appError.isOperational) {
            // @todo: add handler
        }
    }
};

process.on('unhandledRejection', (reason: any) => {
    globalErrorHandler(
        new AppError(
            AppErrorEnum.UnhandledRejection,
            reason instanceof Error ? reason : new Error(String(reason)),
        ),
    );
});

process.on('uncaughtException', (error: Error) => {
    globalErrorHandler(new AppError(AppErrorEnum.UncaughtException, error));
});

export async function main() {
    if (process.env.ENABLE_HEAP_SNAPSHOTS === 'true') {
        startHeapSnapshotCollection(globalConfig.LOGGER.logDir);
    }

    const app = new RelayerApp({
        routerContractAbi,
        messageSentEventAbi,
    });

    await app.init();
}

main().catch(globalErrorHandler);
