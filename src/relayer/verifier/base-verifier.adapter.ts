import { RetryQueueService } from '../services';
import { ContextProvider } from '../services/context.provider';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextProvider {
    protected readonly reportJobQueue: RetryQueueService;

    protected constructor(name: string, context: Context, reportJobQueue: RetryQueueService) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}
