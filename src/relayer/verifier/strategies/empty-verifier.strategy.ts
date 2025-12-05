import { BaseVerifierStrategy } from './base-verifier.strategy';
import { VerifierStrategy } from './verifier.interface';

import { Context } from '../../types';
import { VerifierModule } from '../verifier.module';

// common strategy
export class EmptyVerifierStrategy extends BaseVerifierStrategy implements VerifierStrategy {
    constructor(context: Context) {
        super('EmptyVerifierStrategy', context);
    }

    async requestVerification(payload: VerifierModule.Request.Payload): Promise<void> {
        return Promise.resolve();
    }

    async confirmVerification(payload: VerifierModule.Confirm.Payload): Promise<void> {
        await this.submitMessage(
            payload.data.parsedReceipt.dstChainSelector,
            payload.data.messageReceipt,
            [],
        );
    }
}
