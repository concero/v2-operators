import { BaseVerifierStrategy } from './base-verifier.strategy';
import { VerifierStrategy } from './verifier.interface';

import { Context, JobPayload } from '../../types';

// common strategy
export class EmptyVerifierStrategy extends BaseVerifierStrategy implements VerifierStrategy {
    constructor(context: Context) {
        super('EmptyVerifierStrategy', context);
    }

    async requestVerification(payload: JobPayload): Promise<void> {
        return Promise.resolve();
    }

    async confirmVerification(payload: JobPayload): Promise<void> {
        await this.submitMessage(payload, []);
    }
}
