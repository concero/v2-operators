type AppErrorType = {
    message: string;
    isOperational: boolean;
};

export enum AppErrorEnum {
    ViemCreateClientFailed = 'ViemCreateClientFailed',
    FailedHTTPRequest = 'FailedHTTPRequest',
    UnknownError = 'UnknownError',
    UnhandledRejection = 'UnhandledRejection',
    UncaughtException = 'UncaughtException',
    EnvKeyMissing = 'EnvKeyMissing',
    ChainNotFound = 'ChainNotFound',
    InsufficientGas = 'InsufficientGas',
    InvalidNetworkMode = 'InvalidNetworkMode',
    ContractCallError = 'ContractCallError',
    LogDecodingFailed = 'LogDecodingFailed',
}

const appErrors: Record<AppErrorEnum, AppErrorType> = {
    [AppErrorEnum.ViemCreateClientFailed]: {
        message: 'Failed to create viem client',
        isOperational: false,
    },
    [AppErrorEnum.FailedHTTPRequest]: {
        message: 'Failed to make HTTP request',
        isOperational: true,
    },
    [AppErrorEnum.UnknownError]: {
        message: 'An unknown error occurred',
        isOperational: false,
    },
    [AppErrorEnum.UnhandledRejection]: {
        message: 'Unhandled promise rejection',
        isOperational: true,
    },
    [AppErrorEnum.UncaughtException]: {
        message: 'Uncaught exception',
        isOperational: true,
    },
    [AppErrorEnum.EnvKeyMissing]: {
        message: 'Missing or empty required environment variable',
        isOperational: false,
    },
    [AppErrorEnum.ChainNotFound]: {
        message: 'Chain not found',
        isOperational: false,
    },
    [AppErrorEnum.InsufficientGas]: {
        message: 'Insufficient gas',
        isOperational: false,
    },
    [AppErrorEnum.InvalidNetworkMode]: {
        message: 'Invalid network mode',
        isOperational: false,
    },
    [AppErrorEnum.ContractCallError]: {
        message: 'Failed to call contract',
        isOperational: true,
    },
    [AppErrorEnum.LogDecodingFailed]: {
        message: 'Failed to decode log',
        isOperational: true,
    },
};

export { appErrors };
