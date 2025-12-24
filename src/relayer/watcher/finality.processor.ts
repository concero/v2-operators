import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobStatus } from '../types';
import { Job, Prisma } from '@prisma/client';
import { Hex } from 'viem';

interface ProcessorStrategy {
    buildQuery: (network: ConceroNetwork) => Prisma.JobWhereInput
    inclusion: 'dst' | 'src'
    filter: (job: Job, lastChainBlock: bigint, lastFinalizedBlock: bigint) => boolean
    nextStatus: JobStatus
}

export class FinalityProcessor extends ContextProvider {
    private readonly strategies: ProcessorStrategy[] = [];

    constructor(context: Context, strategies: ProcessorStrategy[]) {
        super('FinalityProcessor', context);
        this.strategies = strategies;
    }

    async process(network: ConceroNetwork, chainBlock: bigint, finalizedBlock: bigint): Promise<void> {
        const promises = this.strategies.map(
            async (strategy) => this.processStrategy(network, chainBlock, finalizedBlock, strategy)
        )

        await Promise.all(promises);
    }

    private async processStrategy(
        network: ConceroNetwork,
        chainBlock: bigint,
        finalizedBlock: bigint,
        strategy: ProcessorStrategy,
    ): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            strategy.buildQuery(network),
            { take: 100 }
        )

        const promises = batch
            .filter(job => strategy.filter(job, chainBlock, finalizedBlock))
            .map(async job => {
                const publicClient = await this.context.viemClient.getClients(network.name).publicClient

                if (strategy.inclusion === 'src') {
                    const tx = await publicClient.getTransaction({ hash: job.srcTxHash as Hex })
                    if (!tx) throw Error(`Job inclusion failed [srcTxHash=${job.srcTxHash}]`);
                } else {
                    const tx = await publicClient.getTransaction({ hash: job.dstTxHash as Hex })
                    if (!tx) throw Error(`Job inclusion failed [dstTxHash=${job.srcTxHash}]`);
                }

                return job.id
            })
        const results = await Promise.allSettled(promises);
        const finalizedJobIds = results
            .filter(i => i.status === 'fulfilled')
            .map(i => i.value);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: strategy.nextStatus },
        );
    }
}
