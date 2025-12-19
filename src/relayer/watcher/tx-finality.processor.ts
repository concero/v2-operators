import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobPayload, JobStatus } from '../types';

export class TxFinalityProcessor extends ContextProvider {
    constructor(context: Context) {
        super('TxFinalityProcessor', context);
    }

    async processBatch(network: ConceroNetwork, currentChainBlock: bigint): Promise<void> {
        const batch = await this.context.jobQueue.getList({
            status: JobStatus.WaitingConfirmations,
            // @todo dst, not src
            srcChainSelector: Number(network.chainSelector),
        });
        const items = batch.map(item => ({
            ...item,
            payload: JSON.parse(item.payload) as JobPayload,
        }));

        // @todo implement check by finalized blockNumber
        // @todo implement check if exists in blockchain
        const validJobIds = items
            .filter(
                item =>
                    item.payload.expectedDstBlockNumber &&
                    item.srcChainSelector &&
                    item.payload.expectedDstBlockNumber < currentChainBlock &&
                    // @todo: move to dstChainSelector
                    item.srcChainSelector === Number(network.chainSelector),
            )
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: validJobIds },
            },
            { status: JobStatus.Success },
        );
    }
}
