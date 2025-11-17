import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { RetryQueueService } from '../services';
import { Context } from '../types';

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(ctx: Context, reportJobQueue: RetryQueueService) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
    }

    async process(payload: VerifierAdapter.Payload) {}
}
