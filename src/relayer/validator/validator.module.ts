import { CREValidatorAdapter, EmptyValidatorAdapter, IValidatorAdapter } from './adapters';
import { ValidatorApiService } from './validator-api.service';

import { Context, ValidatorType } from '../types';

export class ValidatorModule {
    private readonly api: ValidatorApiService;
    private readonly adapters: Record<ValidatorType, IValidatorAdapter>;

    constructor(context: Context) {
        this.api = new ValidatorApiService(context);
        this.adapters = {
            [ValidatorType.CRE]: new CREValidatorAdapter(context),
            [ValidatorType.Empty]: new EmptyValidatorAdapter(context),
        };
    }

    async init() {
        await this.api.init();

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingRequest()),
            );
        }, 2000);
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpFailedRequest()),
            );
        }, 1000);
        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter => adapter.pumpPendingConfirm()),
            );
        }, 1000);

        setInterval(async () => {
            await Promise.all(
                Object.values(this.adapters).map(async adapter =>
                    adapter.pumpStuckVerificationRequests(),
                ),
            );
        }, 30_000);
    }
}
