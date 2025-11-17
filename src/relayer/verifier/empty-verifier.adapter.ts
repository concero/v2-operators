import { BaseVerifierAdapter } from './base-verifier.adapter';
import { ReportJobQueue } from './report-job-queue';
import { VerifierAdapter } from './types';

import { Context } from '../types';

export class EmptyVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: ReportJobQueue) {
        super('EmptyRelayerAdapter', context, reportJobQueue);
    }

    async process(payload: VerifierAdapter.Payload): Promise<void> {}
}
