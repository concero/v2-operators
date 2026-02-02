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
        Rate allocation:
        - New requests: 900  req/min (~70%)
        - Failed:       450  req/min (~30%)

        Tick configuration:

        | Flow          | Tick Interval | Batch Size | Batch count | Max req/min | Max tx/min  |
        |---------------|---------------|------------|-------------|-------------|-------------|
        | Pending       | 2 seconds     | 7          | 30          | 900         | 6300        |
        | Failed        | 4 seconds     | 7          | 30          | 450         | 3150        |
        | Total         | -             | -          | -           | 1350        | 9450        |
   */

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpPendingVerification(pumpBatchCountPerTick * creBatchSize),
                ),
            );
        }, 2000);

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
