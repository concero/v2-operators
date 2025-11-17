import { ReportJobQueue } from './report-job-queue';

import { ContextService } from '../services';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextService {
    protected readonly reportJobQueue: ReportJobQueue;

    protected constructor(name: string, context: Context, reportJobQueue: ReportJobQueue) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}
