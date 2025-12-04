import { ConceroNetwork } from '@concero/operator-utils';
import { BaseLogService } from './base-log.service';

import { DecodedLog } from '../../types';
import { Context, DecodedMessageLogReceipt, MessageSentLogData } from '../types';
import { VerifierType } from '../verifier';

type Item = {
    chainName: string;
    parsedReceipt: DecodedMessageLogReceipt;
    parsedLog: DecodedLog<MessageSentLogData>;
    expectedBlockNumber: bigint;
    verifierType: VerifierType;
};

function buildCondition(
    type: 'select' | 'exclude',
    chainName: string,
    expectedBlockNumber: bigint,
): (item: Item) => boolean {
    return (i: Item) =>
        type === 'select'
            ? i.expectedBlockNumber < expectedBlockNumber && i.chainName === chainName
            : !(i.expectedBlockNumber < expectedBlockNumber && i.chainName === chainName);
}

export class LogFinalityService extends BaseLogService {
    private waitingConfirmationStack: Item[] = [];

    constructor(context: Context) {
        super('LogFinalityService', context);
    }

    // @todo: move united job for message with status & store that stack in DB
    async addToStack(item: Item) {
        this.waitingConfirmationStack.push(item);
    }

    init() {
        this.forEachActiveNetwork(async (network, blockManager) => {
            blockManager.watchBlocks({
                onBlockRange: (_, endBlock) => this.processFinalityByChain(network, endBlock),
            });
        });
    }

    private async processFinalityByChain(
        network: ConceroNetwork,
        lastBlock: bigint,
    ): Promise<void> {
        const selectCondition = buildCondition('select', network.name, lastBlock);
        const excludeCondition = buildCondition('exclude', network.name, lastBlock);

        const verifiedItems = this.waitingConfirmationStack.filter(selectCondition);
        for (const item of verifiedItems) {
            this.requestVerification(item.parsedLog, item.parsedReceipt, item.verifierType);
        }

        this.waitingConfirmationStack = this.waitingConfirmationStack.filter(excludeCondition);
    }
}
