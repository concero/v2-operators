import { maxUint64 } from 'viem';
import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { FinalityProcessor } from './finality.processor';
import { Job } from '@prisma/client';

import { DecodedMessageSentReceipt, JobPayload, JobStatus } from '../../types';
import { ChainsSetupService } from '../services/chains-setup.service';
import { Context } from '../types';

export class WatcherModule extends ChainsSetupService {
    private readonly finalityProcessor: FinalityProcessor;

    constructor(context: Context) {
        super('WatcherModule', context);
        this.finalityProcessor = new FinalityProcessor(context, [
            // src finalized & common
            {
                buildQuery: network => ({
                    status: JobStatus.WaitingSrcConfirmation,
                    srcChainSelector: Number(network.chainSelector),
                }),
                filter: (job: Job, lastChainBlock: bigint, lastFinalizedBlock: bigint) => {
                    const jobPayload = JSON.parse(job.payload) as JobPayload;
                    const delta = this.extractSrcBlocksDelta(jobPayload.parsedReceipt);
                    this.logger.info(`srcFilter for job (id=${job.id}) delta=${String(delta)}`);

                    if (delta === 'finalized') {
                        // src finalized
                        const isFinalityEnabled = this.context.chainsManager.getFinalityTagEnabled(
                            job.srcChainSelector,
                        );
                        if (!isFinalityEnabled) {
                            // @todo: mark status as Failed
                            return false;
                        }
                        return BigInt(job.srcBlockNumber) < lastFinalizedBlock;
                    } else {
                        // src confirmations offset
                        const result = BigInt(job.srcBlockNumber) + BigInt(delta) < lastChainBlock;
                        this.logger.info(
                            `srcFilter ${job.srcBlockNumber}+${String(delta)}<${String(lastChainBlock)} is ${
                                result ? 'true' : 'false'
                            }`,
                        );
                        return result;
                    }
                },
                inclusion: 'src',
            },
            // dst (use only finalized on dst side)
            {
                buildQuery: network => ({
                    status: JobStatus.WaitingDstFinality,
                    dstChainSelector: Number(network.chainSelector),
                    dstBlockNumber: { not: null },
                    dstTxHash: { not: null },
                }),
                inclusion: 'dst',
                filter: (job: Job, _, lastFinalizedBlock) => {
                    const isEnabled = this.context.chainsManager.getFinalityTagEnabled(
                        job.dstChainSelector,
                    );
                    if (!isEnabled) {
                        // @todo: if not enabled - mark as failed
                        return false;
                    }
                    const result = BigInt(job.dstBlockNumber as string) < lastFinalizedBlock;
                    this.logger.info(
                        `dstFilter ${job.dstBlockNumber}<${String(lastFinalizedBlock)} is ${
                            result ? 'true' : 'false'
                        }`,
                    );
                    return result;
                },
            },
        ]);
    }

    private extractSrcBlocksDelta(parsedReceipt: DecodedMessageSentReceipt) {
        if (parsedReceipt.srcChainData.blockConfirmations === maxUint64) {
            const isEnabledFinalized = this.context.chainsManager.getFinalityTagEnabled(
                parsedReceipt.srcChainSelector,
            );

            if (isEnabledFinalized) {
                return 'finalized';
            }

            return this.context.chainsManager.getFinalityBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        } else if (BigInt(parsedReceipt.srcChainData.blockConfirmations) === 0n) {
            return this.context.chainsManager.getMinBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        }

        return parsedReceipt.srcChainData.blockConfirmations;
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        blockManager.watchBlocks({
            onBlockRange: (_: bigint, lastChainBlock, finalizedBlock) =>
                this.finalityProcessor.process(network, lastChainBlock, finalizedBlock ?? 0n),
        });
    }
}
