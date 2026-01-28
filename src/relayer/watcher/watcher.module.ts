import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { FinalityProcessor } from './finality.processor';
import { Job } from '@prisma/client';

import { JobErrorCode, JobStatus } from '../../types';
import { ChainsSetupService } from '../services/chains-setup.service';
import { Context } from '../types';

export class WatcherModule extends ChainsSetupService {
    private readonly finalityProcessor: FinalityProcessor;

    constructor(context: Context) {
        super('WatcherModule', context);
        this.finalityProcessor = new FinalityProcessor(context, [
            // src common
            {
                buildQuery: network => ({
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
                buildQuery: network => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                    srcBlockNumberDelta: 'finalized',
                }),
                inclusion: 'src',
                filter: (job: Job, _, lastFinalizedBlock: bigint) => {
                    const isEnabled = this.checkFinalityEnabled(job.id, job.srcChainSelector);
                    if (!isEnabled) {
                        return false;
                    }

                    return BigInt(job.srcBlockNumber) < lastFinalizedBlock;
                },
            },
            // dst (use only finalized on dst side)
            {
                buildQuery: network => ({
                    status: JobStatus.WaitingDstFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstTxHash: { not: null },
                }),
                inclusion: 'dst',
                filter: (job: Job, lastChainBlock: bigint) => {
                    // if not enabled - mark as failed
                    const isEnabled = this.checkFinalityEnabled(job.id, job.dstChainSelector);
                    if (!isEnabled) {
                        return false;
                    }

                    const delta =
                        this.context.deploymentManager.getFinalityBlockConformationsByChainSelector(
                            job.dstChainSelector,
                        );
                    return BigInt(job.dstBlockNumber ?? 0) + delta < lastChainBlock;
                },
            },
        ]);
    }

    private checkFinalityEnabled(jobId: number, chainSelector: number): boolean {
        if (!this.context.deploymentManager.getFinalityTagEnabled(chainSelector)) {
            this.context.jobQueue.updateOne(
                { id: jobId },
                {
                    status: JobStatus.Failed,
                    errorCode: JobErrorCode.ChainFinalityTagNotEnabled,
                },
            );

            return false;
        }

        return true;
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        blockManager.watchBlocks({
            onBlockRange: (_: bigint, lastChainBlock, finalizedBlock) =>
                this.finalityProcessor.process(network, lastChainBlock, finalizedBlock ?? 0n),
        });
    }
}
