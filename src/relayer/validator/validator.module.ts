import {
    creBatchSize,
    CREValidatorAdapter,
    EmptyValidatorAdapter,
    IValidatorAdapter,
    pumpBatchCountPerTick,
} from './adapters';

import { Context, ValidatorType } from '../types';

export class ValidatorModule {
    private readonly adapters: Record<ValidatorType, IValidatorAdapter>;

    constructor(context: Context) {
        this.adapters = {
            [ValidatorType.CRE]: new CREValidatorAdapter(context),
            [ValidatorType.Empty]: new EmptyValidatorAdapter(context),
        };
    }

    async init() {
        /*

        Tick configuration:

        | Flow          | Tick Interval | Batch Size | Batch count | Max req/min | Max tx/min  |
        |---------------|---------------|------------|-------------|-------------|-------------|
        | Pending       | 5 seconds     | 40         | 2           | 24          | 960         |
        | Failed        | 4 seconds     | 40         | 2           | -           | 1200        |
        | Total         | -             | -          | -           | 24          | 2760        |
       */

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpPendingVerification(pumpBatchCountPerTick * creBatchSize),
                ),
            );
        }, 5000);

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpFailedVerification(6 * creBatchSize),
                ),
            );
        }, 4000);

        // DB read/write with status change, not limited

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpStuckVerificationRequests(50),
                ),
            );
        }, 5000);

        // tx submit (no rate limit because of viem batching), limited by RPCs
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingSubmit(100)),
            );
        }, 1000);
    }
}
