import { BaseVerifierStrategy } from './base-verifier.strategy';
import { VerifierStrategy } from './verifier.interface';

import { Context } from '../../types';

// common strategy
export class EmptyVerifierStrategy extends BaseVerifierStrategy implements VerifierStrategy {
    constructor(context: Context) {
        super('EmptyVerifierStrategy', context);
    }

    async requestVerification(payload: VerifierStrategy.Payload): Promise<void> {
        return Promise.resolve();
    }

    async confirmVerification(payload: VerifierStrategy.Payload): Promise<void> {
        await this.submitMessage(
            payload.parsedReceipt.dstChainSelector,
            payload.data.messageReceipt,
            [],
        );
    }
}
