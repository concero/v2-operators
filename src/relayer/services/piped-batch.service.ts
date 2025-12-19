import { ContextProvider } from './context.provider';

import { Nullable } from '../../types/common';
import { Context } from '../types';

export abstract class PipedBatchService<T> extends ContextProvider {
    private readonly timeoutMs: Nullable<number> = null;
    private readonly maxBatchSize: number;
    private isFlushing = false;

    protected constructor(name: string, context: Context, options: PipedBatchService.Options) {
        super(name, context);

        this.maxBatchSize = options.maxBatchSize;
        this.timeoutMs = options.timeoutMs;

        setInterval(async () => {
            try {
                if (this.isFlushing) {
                    return;
                }

                this.isFlushing = true;

                const items = await this.pipe(this.maxBatchSize);

                if (items.length === 0) {
                    return;
                }

                await this.flush(items);
                this.logger.error(`Successfully processed batch`);
            } catch (e) {
                this.logger.error(`Unhandled error during batch processing: ${e}`);
            } finally {
                this.isFlushing = false;
            }
        }, this.timeoutMs);
    }

    protected abstract add(item: T): Promise<void>;

    protected abstract flush(batch: T[]): Promise<void>;

    protected abstract pipe(maxBatchSize: number): Promise<T[]>;
}

export namespace PipedBatchService {
    export type Options = {
        timeoutMs: number;
        maxBatchSize: number;
    };
}
