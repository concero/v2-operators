import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { SrcFinalityProcessor } from './src-finality.processor';
import { TxFinalityProcessor } from './tx-finality.processor';

import { ChainsSetupService } from '../services/chains-setup.service';
import { Context } from '../types';

export class WatcherModule extends ChainsSetupService {
    private readonly srcFinalityProcessor: SrcFinalityProcessor;
    private readonly txFinalityProcessor: TxFinalityProcessor;

    constructor(context: Context) {
        super('WatcherModule', context);
        this.srcFinalityProcessor = new SrcFinalityProcessor(context);
        this.txFinalityProcessor = new TxFinalityProcessor(context);
    }

    protected async setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        const pipeBlockNumber = this.pipeBlockNumber.bind(this);
        blockManager.watchBlocks({
            // @ts-ignore @todo: fix typings
            onBlockRange: (_: bigint, currentChainBlock: bigint, finalizedBlock?: bigint) =>
                pipeBlockNumber(network, currentChainBlock, finalizedBlock),
        });
    }

    private async pipeBlockNumber(
        network: ConceroNetwork,
        currentChainBlock: bigint,
        currentFinalizedBlock?: bigint,
    ): Promise<void> {
        try {
            this.logger.info(
                `Piping blocks ${network.name}: ${String(currentChainBlock)} ${String(currentFinalizedBlock)}`,
            );
            await Promise.all([
                // @todo: add finalizedBlock in operator-utils lib
                currentFinalizedBlock &&
                    this.srcFinalityProcessor.processFinalizedBatch(network, currentFinalizedBlock),
                this.srcFinalityProcessor.processCommonBatch(network, currentChainBlock),
                currentFinalizedBlock &&
                    this.txFinalityProcessor.processFinalizedBatch(network, currentFinalizedBlock),
                this.txFinalityProcessor.processCommonBatch(network, currentChainBlock),
            ]);
        } catch (e) {
            this.logger.error(`Unhandled error: ${e}`);
        }
    }
}
