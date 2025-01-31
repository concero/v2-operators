import { AppErrorEnum, appErrors } from "../../../constants/appErrors";
import { logger } from "./logger";

class AppError extends Error {
    public readonly isOperational: boolean;

    constructor(errorType: AppErrorEnum, originalError?: Error) {
        const { message, isOperational } = appErrors[errorType];
        super(originalError ? `${message}: ${originalError.message}` : message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
        this.isOperational = isOperational;

        Error.captureStackTrace(this);

        this.logError();
    }

    private logError() {
        logger.error({
            name: this.name,
            message: this.message,
            stack: this.stack,
            isOperational: this.isOperational,
        });

        if (!this.isOperational) {
            process.exit(1);
        }
    }
}

export { AppError };
