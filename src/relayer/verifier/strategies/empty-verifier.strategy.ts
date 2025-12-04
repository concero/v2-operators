import { BaseVerifierStrategy } from './base-verifier.strategy';
import { VerifierStrategy } from './verifier.interface';

import { JobQueue } from '../../services';
import { Context } from '../../types';
import { VerifierModule } from '../verifier.module';

// common strategy
export class EmptyVerifierStrategy extends BaseVerifierStrategy implements VerifierStrategy {
    constructor(context: Context, jobQueue: JobQueue) {
        super('EmptyVerifierStrategy', context, jobQueue);
    }

    async requestVerification(payload: VerifierModule.Request.Payload): Promise<void> {
        return this.context.eventBus.confirmVerification(payload);
    }

    async confirmVerification(payload: VerifierModule.Confirm.Payload): Promise<void> {
        await this.submitMessage(
            payload.data.parsedReceipt.dstChainSelector,
            payload.data.messageReceipt,
            [],
        );
    }
}
