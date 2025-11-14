import { LoggerInterface } from '@concero/operator-utils';
import { Context } from './types';

export abstract class RelayerContext {
    protected readonly logger: LoggerInterface;
    protected readonly context: Context;

    protected constructor(name: string, context: Context) {
        this.logger = context.logger.getLogger(name);
        this.context = context;
    }
}
