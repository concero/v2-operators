import { ContextProvider } from '../services';
import { Context } from '../types';

const baseDelayMs = 30 * 1000; // 30 sec
const maxDelayMs = 2 * 60 * 1000; // 2 min

export abstract class BaseValidatorService extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected calculateNextPlannedTo(attempts: number): Date {
        const delay = Math.min(baseDelayMs * 2 ** attempts, maxDelayMs);

        // to avoid DDoS due to critical issue we use jitter (randomizer for delay)
        const jitter = delay * (0.5 + Math.random() * 0.5);

        return new Date(Date.now() + jitter);
    }
}
