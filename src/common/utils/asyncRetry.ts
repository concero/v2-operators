import { Logger } from "./logger";
import { sleep } from "./sleep";

export interface RetryOptions {
    maxRetries?: number;
    delayMs?: number;
    isRetryableError?: (error: any) => Promise<boolean>;
}

export async function asyncRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const { maxRetries = 3, delayMs = 2000, isRetryableError = () => false } = options;
    const logger = Logger.getInstance().getLogger("AsyncRetry");

    let attempt = 0;
    let lastError;

    while (attempt <= maxRetries) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if ((await isRetryableError(error)) && attempt < maxRetries) {
                ++attempt;

                logger.debug(`Retry attempt ${attempt} failed. Retrying in ${delayMs}ms...`);

                await sleep(delayMs);
            } else {
                throw error;
            }
        }
    }

    throw lastError;
}
