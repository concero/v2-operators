import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobPayload, JobStatus } from '../types';

export class SrcFinalityProcessor extends ContextProvider {
    constructor(context: Context) {
        super('SrcFinalityProcessor', context);
    }

    async processBatch(network: ConceroNetwork, currentChainBlock: bigint): Promise<void> {
        const batch = await this.context.jobQueue.getList({
            status: JobStatus.WaitingConfirmations,
            srcChainSelector: Number(network.chainSelector),
        });
        const items = batch.map(item => ({
            ...item,
            payload: JSON.parse(item.payload) as JobPayload,
        }));

        // items
        const validItems = items.filter(
            item =>
                item.payload.expectedSrcBlockNumber &&
                item.srcChainSelector &&
                item.payload.expectedSrcBlockNumber < currentChainBlock &&
                item.srcChainSelector === Number(network.chainSelector),
        );

        await this.context.jobQueue.updateMany(
            {
                id: { in: validItems.map(i => i.id) },
            },
            { status: JobStatus.ProcessingRequest },
        );
    }
}
