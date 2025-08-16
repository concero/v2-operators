import { AppErrorEnum, appErrors } from '../constants';

export class AppError extends Error {
    public readonly isOperational: boolean;

    constructor(errorType: AppErrorEnum, originalError?: Error) {
        const { message, isOperational } = appErrors[errorType];
        super(originalError ? `${message}: ${originalError.message}` : message);
        Object.setPrototypeOf(this, new.target.prototype);

        this.name = this.constructor.name;
        this.isOperational = isOperational;
        this.stack = originalError?.stack;

        this.logError();

        if (!this.isOperational) {
            process.exit(1);
        }
    }

    private logError() {
        console.error({
            name: this.name,
            message: this.message,
            stack: this.stack,
            isOperational: this.isOperational,
        });
    }
}
