import { VerifierStrategy, VerifierType } from './strategies';
import { VerifierApiService } from './verifer-api.service';
import { VerifierExecutorService } from './verifier-executor.service';

import { JobQueue } from '../services';
import { Context } from '../types';

export class VerifierModule {
    private readonly verifierApiService: VerifierApiService;
    private readonly verifierExecutorService: VerifierExecutorService;
    private readonly jobQueue: JobQueue;

    constructor(context: Context) {
        this.jobQueue = new JobQueue(context);
        this.verifierApiService = new VerifierApiService(context);
        this.verifierP;
    }
}

export namespace VerifierModule {
    export namespace Request {
        export const command = 'request_verification';
        export type Payload = VerifierStrategy.Payload & {
            type: VerifierType;
        };
    }
    export namespace Confirm {
        export const command = 'confirm_verification';
        export type Payload = VerifierStrategy.Payload & {
            type: VerifierType;
        };
    }
}
