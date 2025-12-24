import { BlockManager, ConceroNetwork } from '@concero/operator-utils';

import { ChainsSetupService } from '../services/chains-setup.service';
import { Context } from '../types';
import { FinalityProcessor } from './finality.processor';
import { Job } from '@prisma/client';
import { JobStatus } from '../../types';

export class WatcherModule extends ChainsSetupService {
    private readonly finalityProcessor: FinalityProcessor;

    constructor(context: Context) {
        super('WatcherModule', context);
        this.finalityProcessor = new FinalityProcessor(context, [
            // src common
            {
                buildQuery: (network) => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                    srcBlockNumberDelta: { not: 'finalized' },
                }),
                filter: (job: Job, lastChainBlock: bigint) =>
                    BigInt(job.srcBlockNumber) + BigInt(job.srcBlockNumberDelta) < lastChainBlock,
                inclusion: 'src',
            },
            // src finalized
            {
                buildQuery: (network) => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                    srcBlockNumberDelta: 'finalized',
                }),
                inclusion: 'src',
                filter: (job: Job, _, lastFinalizedBlock: bigint) =>
                    BigInt(job.srcBlockNumber) < lastFinalizedBlock,
            },
            // dst common
            {
                buildQuery: (network) => ({
                    status: JobStatus.WaitingTxFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstBlockNumberDelta: { not: 'finalized' },
                }),
                inclusion: 'dst',
                filter: (job: Job, lastChainBlock: bigint) =>
                    (BigInt(job.dstBlockNumber ?? 0) + BigInt(job.dstBlockNumberDelta) < lastChainBlock)
                    && Boolean(job.dstTxHash)
            },
            // dst finalized
            {
                buildQuery: (network) => ({
                    status: JobStatus.WaitingTxFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstBlockNumberDelta: 'finalized',
                }),
                inclusion: 'dst',
                filter: (job: Job, _, lastFinalizedBlock: bigint) =>
                    (BigInt(job.dstBlockNumber ?? 0) < lastFinalizedBlock) && Boolean(job.dstTxHash)
            }
        ])
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {

        blockManager.watchBlocks({
            onBlockRange: (_: bigint, lastChainBlock, finalizedBlock) =>
                this.finalityProcessor.process(network, lastChainBlock, finalizedBlock ?? 0n),
        });
    }
}
