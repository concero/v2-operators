type AppErrorType = {
    message: string;
    isOperational: boolean;
};

const appErrors: Record<string, AppErrorType> = {
    ViemCreateClientFailed: {
        message: "Failed to create viem client",
        isOperational: false,
    },
    FailedHTTPRequest: {
        message: "Failed to make HTTP request",
        isOperational: true,
    },
    UnknownError: {
        message: "An unknown error occurred",
        isOperational: false,
    },
    UnhandledRejection: {
        message: "Unhandled promise rejection",
        isOperational: false,
    },
    UncaughtException: {
        message: "Uncaught exception",
        isOperational: false,
    },
};

export { appErrors };
