import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobStatus } from '../types';

export class SrcFinalityProcessor extends ContextProvider {
    constructor(context: Context) {
        super('SrcFinalityProcessor', context);
    }

    async processCommonBatch(network: ConceroNetwork, lastChainBlock: bigint): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            {
                status: JobStatus.WaitingSrcConfirmation,
                srcChainSelector: Number(network.chainSelector),
                srcBlockNumberDelta: { not: 'finalized' },
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .filter(
                item =>
                    BigInt(item.srcBlockNumber) + BigInt(item.srcBlockNumberDelta) < lastChainBlock,
            )
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: JobStatus.ProcessingRequest },
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
                srcBlockNumberDelta: 'finalized',
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .filter(item => BigInt(item.srcBlockNumber) <= lastFinalizedBlock)
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: JobStatus.ProcessingRequest },
        );
    }
}
