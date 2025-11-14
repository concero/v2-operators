import { BaseVerifierAdapter } from './base-verifier.adapter';
import { ReportJobQueue } from './report-job-queue';
import { VerifierAdapter } from './types';

import { Context } from '../types';

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(ctx: Context, reportJobQueue: ReportJobQueue) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
    }

    async requestMessageReport(payload: VerifierAdapter.Payload) {}
}
