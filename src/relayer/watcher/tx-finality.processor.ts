import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobPayload, JobStatus } from '../types';

export class TxFinalityProcessor extends ContextProvider {
    constructor(context: Context) {
        super('TxFinalityProcessor', context);
    }

    async processCommonBatch(network: ConceroNetwork, lastChainBlock: bigint): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            {
                status: JobStatus.WaitingSrcConfirmation,
                dstChainSelector: Number(network.chainSelector),
                dstBlockNumberDelta: { not: 'finalized' },
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .map(i => ({ ...i, payload: JSON.parse(i.payload) as JobPayload }))
            .filter(
                item =>
                    BigInt(item.dstBlockNumber as string) + BigInt(item.dstBlockNumberDelta) <
                    lastChainBlock,
            )
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: JobStatus.Success },
        );
    }

    async processFinalizedBatch(
        network: ConceroNetwork,
        lastFinalizedBlock: bigint,
    ): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            {
                status: JobStatus.WaitingSrcConfirmation,
                srcChainSelector: Number(network.chainSelector),
                dstBlockNumberDelta: 'finalized',
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .filter(item => BigInt(item.dstBlockNumber as string) <= lastFinalizedBlock)
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: JobStatus.Success },
        );
    }
}
