import { CREValidatorAdapter, EmptyValidatorAdapter, IValidatorAdapter } from './adapters';

import { Context, ValidatorType } from '../types';

export class ValidatorModule {
    // private readonly callbacksProcessor: CallbacksProcessor;
    private readonly adapters: Record<ValidatorType, IValidatorAdapter>;

    constructor(context: Context) {
        // this.callbacksProcessor = new CallbacksProcessor(context);
        this.adapters = {
            [ValidatorType.CRE]: new CREValidatorAdapter(context),
            [ValidatorType.Empty]: new EmptyValidatorAdapter(context),
        };
    }

    async init() {
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingRequest()),
            );
        }, 20000);
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpFailedRequest()),
            );
        }, 10000);
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingConfirm()),
            );
        }, 15000);

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpStuckVerificationRequests(),
                ),
            );
        }, 30_000);
    }
}
