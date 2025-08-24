import { AppErrorEnum } from './constants';
import { AppError } from './utils';
import { startHeapSnapshotCollection } from './utils/heapSnapshotCollector';

import { BlockManagerRegistry } from '@concero/operator-utils';

import './utils/configureDotEnv';
import { initializeManagers } from './utils/initializeManagers';
import { globalConfig } from './constants';

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
        startHeapSnapshotCollection(globalConfig.LOGGER.LOG_DIR);
    }

    await initializeManagers();

    const blockManagerRegistry = BlockManagerRegistry.getInstance();
    for (const blockManager of blockManagerRegistry.getAllBlockManagers()) {
        await blockManager.startPolling();
    }
}

main().catch(globalErrorHandler);
