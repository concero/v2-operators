import './utils/configureDotEnv';

import { BlockManagerRegistry } from '@concero/operator-utils';
import { AppErrorEnum, globalConfig } from './constants';
import { AppError } from './utils';

import { startHeapSnapshotCollection } from './utils/heapSnapshotCollector';
import { initializeManagers } from './utils/initializeManagers';

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

    await initializeManagers();

    BlockManagerRegistry.getInstance().startPolling();
}

main().catch(globalErrorHandler);
