import { LoggerInterface } from '@concero/operator-utils';
import { ValidatorApiService } from './validator-api.service';

import { Context, ValidatorType } from '../types';
import { CREValidatorAdapter } from './adapters/cre-validator.adapter';
import { EmptyValidatorAdapter } from './adapters/empty-validator.adapter';
import { IValidatorAdapter } from './adapters/validator-adapter.interface';

export class ValidatorModule {
    private readonly context: Context;
    private readonly logger: LoggerInterface;
    private readonly api: ValidatorApiService;
    private readonly adapters: Record<ValidatorType, IValidatorAdapter>;

    constructor(context: Context) {
        this.context = context;
        this.logger = this.context.logger.getLogger('ValidatorModule');
        this.api = new ValidatorApiService(context);
        this.adapters = {
            [ValidatorType.CRE]: new CREValidatorAdapter(context),
            [ValidatorType.Empty]: new EmptyValidatorAdapter(context),
        };
    }

    async setup() {
        this.api.init();

        setInterval(async () => {
            await Promise.all([
                Object.values(this.adapters).forEach(async adapter => {
                    await Promise.allSettled([
                        adapter.pumpPendingRequest(),
                        adapter.pumpFailedRequest(),
                        adapter.pumpPendingConfirm(),
                        adapter.pumpFailedConfirm(),
                    ]);
                }),
            ]);
        }, 10000);
        // infinite retries for request & confirm
    }
}

export namespace VerifierModule {
    export namespace Request {
        export const command = 'request_verification';
    }
    export namespace Confirm {
        export const command = 'confirm_verification';
    }
}
