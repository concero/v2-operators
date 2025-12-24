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
                where: (network) => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                    srcBlockNumberDelta: { not: 'finalized' },
                }),
                filter: (job: Job, lastChainBlock: bigint) =>
                    BigInt(job.srcBlockNumber) + BigInt(job.srcBlockNumberDelta) < lastChainBlock,
                nextStatus: JobStatus.ProcessingRequest
            },
            // src finalized
            {
                where: (network) => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                    srcBlockNumberDelta: 'finalized',
                }),
                filter: (job: Job, _, lastFinalizedBlock: bigint) =>
                    BigInt(job.srcBlockNumber) < lastFinalizedBlock,
                nextStatus: JobStatus.ProcessingRequest
            },
            // dst common
            {
                where: (network) => ({
                    status: JobStatus.WaitingTxFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstBlockNumberDelta: { not: 'finalized' },
                }),
                filter: (job: Job, lastChainBlock: bigint) =>
                    BigInt(job.dstBlockNumber ?? 0) + BigInt(job.dstBlockNumberDelta) < lastChainBlock,
                nextStatus: JobStatus.Success
            },
            // dst finalized
            {
                where: (network) => ({
                    status: JobStatus.WaitingTxFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstBlockNumberDelta: 'finalized',
                }),
                filter: (job: Job, _, lastFinalizedBlock: bigint) =>
                    BigInt(job.dstBlockNumber ?? 0) < lastFinalizedBlock,
                nextStatus: JobStatus.Success
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
