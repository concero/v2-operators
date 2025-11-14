import { ReportJobQueue } from './report-job-queue';

import { RelayerContext } from '../relayer-context';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends RelayerContext {
    protected readonly reportJobQueue: ReportJobQueue;

    protected constructor(name: string, context: Context, reportJobQueue: ReportJobQueue) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}
