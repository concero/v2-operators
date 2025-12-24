import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../services';
import { Context, JobStatus } from '../types';
import { Job, Prisma } from '@prisma/client';

interface ProcessorStrategy {
    where: (network: ConceroNetwork) => Prisma.JobWhereInput
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
        await Promise.all(
            this.strategies.map(
                async (strategy) => this.processStrategy(network, chainBlock, finalizedBlock, strategy)
            )
        );
    }

    private async processStrategy(
        network: ConceroNetwork,
        chainBlock: bigint,
        finalizedBlock: bigint,
        strategy: ProcessorStrategy,
    ): Promise<void> {
        const batch = await this.context.jobQueue.getList(
            strategy.where(network),
            { take: 100 }
        )

        const finalizedJobIds = batch
            .filter(job => strategy.filter(job, chainBlock, finalizedBlock))
            .map(i => i.id);

        await this.context.jobQueue.updateMany(
            {
                id: { in: finalizedJobIds },
            },
            { status: strategy.nextStatus },
        );
    }
}
