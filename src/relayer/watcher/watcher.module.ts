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
                        const isFinalityEnabled =
                            this.context.deploymentManager.getFinalityTagEnabled(
                                job.srcChainSelector,
                            );
                        if (!isFinalityEnabled) {
                            // @todo: mark status as Failed
                            return false;
                        }
                        const result = BigInt(job.srcBlockNumber) < lastFinalizedBlock;
                        this.logger.info(
                            `srcFilter ${job.srcBlockNumber}<${String(lastFinalizedBlock)} is ${
                                result ? 'true' : 'false'
                            }`,
                        );
                        return result;
                    } else {
                        // src confirmations offset
                        const result = BigInt(job.srcBlockNumber) + delta < lastChainBlock;
                        this.logger.info(
                            `srcFilter ${job.srcBlockNumber}+${String(delta)}<${lastChainBlock} is ${
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
                filter: (job: Job, lastChainBlock, lastFinalizedBlock) => {
                    const isFinalityEnabled = this.context.deploymentManager.getFinalityTagEnabled(
                        job.dstChainSelector,
                    );
                    if (isFinalityEnabled) {
                        const result = BigInt(job.dstBlockNumber as string) < lastFinalizedBlock;
                        this.logger.info(
                            `dstFilter (finality enabled) ${String(job.dstBlockNumber)}<${String(lastFinalizedBlock)} is ${
                                result ? 'true' : 'false'
                            }`,
                        );

                        return result;
                    } else {
                        const minConfirmations =
                            this.context.deploymentManager.getMinBlockConformationsByChainSelector(
                                job.dstChainSelector,
                            );
                        const result =
                            BigInt(job.dstBlockNumber as string) + minConfirmations <
                            lastChainBlock;
                        this.logger.info(
                            `dstFilter (finality not enabled) ${String(job.dstBlockNumber)}+${String(minConfirmations)}<${String(lastFinalizedBlock)} is ${
                                result ? 'true' : 'false'
                            }`,
                        );
                        return result;
                    }
                },
            },
        ]);
    }

    private extractSrcBlocksDelta(parsedReceipt: DecodedMessageSentReceipt) {
        if (BigInt(parsedReceipt.srcChainData.blockConfirmations) === maxUint64) {
            const isEnabledFinalized = this.context.deploymentManager.getFinalityTagEnabled(
                parsedReceipt.srcChainSelector,
            );

            if (isEnabledFinalized) {
                return 'finalized';
            }

            return this.context.deploymentManager.getFinalityBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        } else if (BigInt(parsedReceipt.srcChainData.blockConfirmations) === 0n) {
            return this.context.deploymentManager.getMinBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        }

        return BigInt(parsedReceipt.srcChainData.blockConfirmations);
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        blockManager.watchBlocks({
            onBlockRange: (_: bigint, lastChainBlock, finalizedBlock) =>
                this.finalityProcessor.process(network, lastChainBlock, finalizedBlock ?? 0n),
        });
    }
}
