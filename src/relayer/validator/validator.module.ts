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
        - New requests: 210 req/min (70%)
        - Failed:       90  req/min (30%)

        Tick configuration:

        | Flow          | Tick Interval | Batch Size | Max req/min |
        |---------------|---------------|------------|-------------|
        | Pending       | 2 seconds     | 7          | 210         | pumpBatchCountPerTick = 7
        | Failed        | 4 seconds     | 6          | 90          |
        */

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpPendingRequest(pumpBatchCountPerTick * creBatchSize),
                ),
            );
        }, 2000);

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpFailedRequest(6 * creBatchSize),
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
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingConfirm(100)),
            );
        }, 1000);
    }
}
