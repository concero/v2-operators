import { ContextProvider, RetryQueueService } from '../services';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextProvider {
    protected readonly reportJobQueue: RetryQueueService;

    protected constructor(name: string, context: Context, reportJobQueue: RetryQueueService) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}
