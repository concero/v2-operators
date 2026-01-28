import { Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { Job, Prisma } from '@prisma/client';

import { JobStatus } from '../../types';
import { ContextProvider } from '../services';
import { Context } from '../types';

interface ProcessorStrategy {
    buildQuery: (network: ConceroNetwork) => Prisma.JobWhereInput;
    inclusion: 'dst' | 'src';
    filter: (job: Job, lastChainBlock: bigint, lastFinalizedBlock: bigint) => boolean;
}

export class FinalityProcessor extends ContextProvider {
    private readonly strategies: ProcessorStrategy[] = [];

    constructor(context: Context, strategies: ProcessorStrategy[]) {
        super('FinalityProcessor', context);
        this.strategies = strategies;
    }

    async process(
        network: ConceroNetwork,
        chainBlock: bigint,
        finalizedBlock: bigint,
    ): Promise<void> {
        const promises = this.strategies.map(async strategy =>
            this.processStrategy(network, chainBlock, finalizedBlock, strategy),
        );

        await Promise.all(promises);
    }

    private async processStrategy(
        network: ConceroNetwork,
        chainBlock: bigint,
        finalizedBlock: bigint,
        strategy: ProcessorStrategy,
    ): Promise<void> {
        const batch = await this.context.jobQueue.getList(strategy.buildQuery(network), {
            take: 100,
        });

        await Promise.all(
            batch
                .filter(job => strategy.filter(job, chainBlock, finalizedBlock))
                .map(async job => {
                    const publicClient = await this.context.viemClient.getClients(network.name)
                        .publicClient;

                    if (strategy.inclusion === 'src') {
                        try {
                            await publicClient.getTransaction({ hash: job.srcTxHash as Hex });
                            await this.context.jobQueue.updateOne(
                                { id: job.id },
                                { status: JobStatus.PendingVerification },
                            );
                        } catch (e) {
                            this.logger.warn(`Job inclusion failed [srcTxHash=${job.srcTxHash}]`);
                            await this.context.jobQueue.updateOne(
                                { id: job.id },
                                { status: JobStatus.Reorged },
                            );
                        }
                    } else {
                        try {
                            await publicClient.getTransaction({ hash: job.dstTxHash as Hex });
                            await this.context.jobQueue.updateOne(
                                { id: job.id },
                                { status: JobStatus.Success },
                            );
                        } catch (e) {
                            this.logger.info(`Job inclusion failed [dstTxHash=${job.srcTxHash}]`);
                            await this.context.jobQueue.updateOne(
                                { id: job.id },
                                { status: JobStatus.PendingSubmit },
                            );
                        }
                    }
                }),
        );
    }
}
