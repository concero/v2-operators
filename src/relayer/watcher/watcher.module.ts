import { BlockManager, ConceroNetwork } from '@concero/operator-utils';
import { SrcFinalityProcessor } from './src-finality.processor';
import { TxFinalityProcessor } from './tx-finality.processor';

import { ChainsSetupService } from '../services';
import { Context } from '../types';

export class WatcherModule extends ChainsSetupService {
    private readonly srcFinalityProcessor: SrcFinalityProcessor;
    private readonly txFinalityProcessor: TxFinalityProcessor;

    constructor(context: Context) {
        super('WatcherModule', context);
        this.srcFinalityProcessor = new SrcFinalityProcessor(context);
        this.txFinalityProcessor = new TxFinalityProcessor(context);
    }

    init() {
        console.log(`start setup WatcherModule`);
        const setup = this.setupEachHandler.bind(this);
        setup();
        console.log(`end setup WatcherModule`);
    }

    protected setupHandler(network: ConceroNetwork, blockManager: BlockManager) {
        const pipeBlockNumber = this.pipeBlockNumber.bind(this);
        blockManager.watchBlocks({
            onBlockRange: (_, currentChainBlock) => pipeBlockNumber(network, currentChainBlock),
        });
    }

    private async pipeBlockNumber(
        network: ConceroNetwork,
        currentChainBlock: bigint,
    ): Promise<void> {
        try {
            await Promise.all([
                // @todo: add finalizedBlock in operator-utils lib
                this.srcFinalityProcessor.processFinalizedBatch(network, currentChainBlock),
                this.srcFinalityProcessor.processCommonBatch(network, currentChainBlock),
                this.txFinalityProcessor.processFinalizedBatch(network, currentChainBlock),
                this.txFinalityProcessor.processCommonBatch(network, currentChainBlock),
            ]);
        } catch (e) {
            this.logger.error(`Unhandled error: ${e}`);
        }
    }
}
