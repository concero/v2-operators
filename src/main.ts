import './utils/configureDotEnv';

import { Abi, AbiEvent, getAbiItem, toEventHash } from 'viem';
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

// 0x03fefa2fad4c5c0c1bc4868e08d602e74720709516574b58632eb741cd57b9cd

export async function main() {
    if (process.env.ENABLE_HEAP_SNAPSHOTS === 'true') {
        startHeapSnapshotCollection(globalConfig.LOGGER.logDir);
    }

    const router = require('./abi/ConceroRouter.json')['abi'] as Abi;
    const verifier = require('./abi/ConceroVerifier.json')['abi'] as Abi;
    const messageSent = getAbiItem({
        abi: router,
        name: 'ConceroMessageSent',
    }) as AbiEvent;
    const eventHash = toEventHash(messageSent);

    console.log({ eventHash });

    const app = new RelayerApp({
        contract: {
            router,
            verifier,
        },
        event: {
            messageSent,
        },
    });

    await app.init();
}

main().catch(globalErrorHandler);
