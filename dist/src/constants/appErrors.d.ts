type AppErrorType = {
    message: string;
    isOperational: boolean;
};
export declare enum AppErrorEnum {
    ViemCreateClientFailed = "ViemCreateClientFailed",
    FailedHTTPRequest = "FailedHTTPRequest",
    UnknownError = "UnknownError",
    UnhandledRejection = "UnhandledRejection",
    UncaughtException = "UncaughtException",
    EnvKeyMissing = "EnvKeyMissing",
    ChainNotFound = "ChainNotFound",
    InsufficientGas = "InsufficientGas",
    InvalidNetworkMode = "InvalidNetworkMode",
    ContractCallError = "ContractCallError",
    LogDecodingFailed = "LogDecodingFailed"
}
declare const appErrors: Record<AppErrorEnum, AppErrorType>;
export { appErrors };
//# sourceMappingURL=appErrors.d.ts.map