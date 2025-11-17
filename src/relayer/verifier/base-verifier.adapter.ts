import { RetryQueue } from './retry-queue';

import { ContextProvider } from '../services';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextProvider {
    protected readonly reportJobQueue: RetryQueue;

    protected constructor(name: string, context: Context, reportJobQueue: RetryQueue) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}
