import { AppErrorEnum } from './constants';
import { AppError } from './utils';

import { BlockManagerRegistry } from '@concero/operator-utils';

import './utils/configureDotEnv';
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
    await initializeManagers();

    const blockManagerRegistry = BlockManagerRegistry.getInstance();
    for (const blockManager of blockManagerRegistry.getAllBlockManagers()) {
        await blockManager.startPolling();
    }
}

main().catch(globalErrorHandler);
