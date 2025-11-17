import { BaseVerifierAdapter } from './base-verifier.adapter';
import { RetryQueue } from './retry-queue';
import { VerifierAdapter } from './types';

import { Context } from '../types';

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(ctx: Context, reportJobQueue: RetryQueue) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
    }

    async process(payload: VerifierAdapter.Payload) {}
}
