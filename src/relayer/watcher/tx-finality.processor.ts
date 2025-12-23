import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobStatus } from '../types';

export class TxFinalityProcessor extends ContextProvider {
    constructor(context: Context) {
        super('TxFinalityProcessor', context);
    }

    async processCommonBatch(network: ConceroNetwork, lastChainBlock: bigint): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            {
                status: JobStatus.WaitingTxFinality,
                dstChainSelector: Number(network.chainSelector),
                dstBlockNumberDelta: { not: 'finalized' },
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .filter(
                item => (item.dstBlockNumber ? BigInt(item.dstBlockNumber) : 0n) <= lastChainBlock,
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
                status: JobStatus.WaitingTxFinality,
                dstChainSelector: Number(network.chainSelector),
                dstBlockNumberDelta: 'finalized',
            },
            { take: 100 },
        );

        const finalizedJobIds = batch
            .filter(
                item =>
                    (item.dstBlockNumber ? BigInt(item.dstBlockNumber) : 0n) <= lastFinalizedBlock,
            )
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: JobStatus.Success },
        );
    }
}
