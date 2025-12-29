import { ContextProvider } from '../services';
import { Context } from '../types';

export class CallbacksProcessor extends ContextProvider {
    constructor(context: Context) {
        super('CallbacksProcessor', context);

        setInterval(async () => {
            await this.calculateCRECallbacks();
        }, 500);
    }

    private async calculateCRECallbacks() {
        const callbacks = await this.context.dbClient.creCallback.groupBy({
            by: ['messageId'],
            _count: {
                messageId: true,
            },
            /* where: {
                job: { OR: [{ callbacksCount: { lt: 10 } }, { callbacksCount: null }] },
            }, */
        });

        await Promise.allSettled(
            callbacks.map(async callback => {
                await this.context.jobQueue.updateOne(
                    { messageId: callback.messageId },
                    { callbacksCount: callback._count.messageId },
                );
            }),
        );
    }
}
