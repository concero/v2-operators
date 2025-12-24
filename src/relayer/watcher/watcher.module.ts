import { BlockManager, ConceroNetwork } from '@concero/operator-utils';

import { ChainsSetupService } from '../services/chains-setup.service';
import { Context, JobStatus } from '../types';
import { FinalityProcessor } from './finality.processor';
import { Job } from '@prisma/client';

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
                nextStatus: JobStatus.ProcessingRequest
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
                nextStatus: JobStatus.ProcessingRequest
            },
            // dst common
            {
                nextStatus: JobStatus.Success,
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
                nextStatus: JobStatus.Success,
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
        const process = this.finalityProcessor.process.bind(this);

        blockManager.watchBlocks({
            onBlockRange: (_: bigint, lastChainBlock, finalizedBlock) =>
                process(network, lastChainBlock, finalizedBlock ?? 0n),
        });
    }
}
