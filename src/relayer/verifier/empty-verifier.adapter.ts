import { BaseVerifierAdapter } from './base-verifier.adapter';
import { RetryQueue } from './retry-queue';
import { VerifierAdapter } from './types';

import { Context } from '../types';

export class EmptyVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: RetryQueue) {
        super('EmptyRelayerAdapter', context, reportJobQueue);
    }

    async process(payload: VerifierAdapter.Payload): Promise<void> {}
}
