import { AppErrorEnum } from '../constants';
export declare class AppError extends Error {
    readonly isOperational: boolean;
    constructor(errorType: AppErrorEnum, originalError?: Error);
    private logError;
}
//# sourceMappingURL=AppError.d.ts.map