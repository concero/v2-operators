import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { RetryQueueService } from '../services';
import { Context } from '../types';

export class EmptyVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: RetryQueueService) {
        super('EmptyRelayerAdapter', context, reportJobQueue);
    }

    async requestVerification(payload: VerifierAdapter.Payload): Promise<void> {
        await this.submitMessage(
            payload.data.parsedReceipt.dstChainSelector,
            payload.data.messageReceipt,
            [],
        );
    }
}
