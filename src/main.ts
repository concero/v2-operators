import './utils/configureDotEnv';

import { Abi, AbiEvent, getAbiItem } from 'viem';
import { AppErrorEnum, globalConfig } from './constants';
import { RelayerApp } from './relayer';
import { AppError } from './utils';

import { startHeapSnapshotCollection } from './utils/heapSnapshotCollector';

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

    const router = require('./abi/ConceroRouter.json')['abi'] as Abi;
    const verifier = require('./abi/ConceroVerifier.json')['abi'] as Abi;
    const app = new RelayerApp({
        contract: {
            router,
            verifier,
        },
        event: {
            messageSent: getAbiItem({
                abi: router,
                name: 'ConceroMessageSent',
            }) as AbiEvent,
        },
    });

    await app.init();
}

main().catch(globalErrorHandler);
