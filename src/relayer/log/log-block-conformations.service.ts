import { ConceroNetwork } from '@concero/operator-utils';
import { BaseLogService } from './base-log.service';

import { DecodedLog } from '../../types';
import { Context, DecodedMessageLogReceipt, JobStatus, MessageSentLogData } from '../types';
import { VerifierStrategy, VerifierType } from '../verifier';

type Item = VerifierStrategy.Payload;

// @todo: move to TxMonitor in operator utils
export class LogBlockConformationsService extends BaseLogService {
    constructor(context: Context) {
        super('LogBlockConformationsService', context);
    }

    init() {
        this.forEachActiveNetwork(async (network, blockManager) => {
            blockManager.watchBlocks({
                onBlockRange: (_, currentChainBlock) =>
                    this.processFinalityByChain(network, currentChainBlock),
            });
        });
    }

    async addToStack(
        parsedLog: DecodedLog<MessageSentLogData>,
        parsedReceipt: DecodedMessageLogReceipt,
        expectedBlockNumber: bigint,
        verifierType: VerifierType,
    ): Promise<void> {
        await this.context.jobQueue.create(
            parsedLog.data.messageId,
            parsedReceipt.srcChainSelector,
            {
                ...parsedLog,
                parsedReceipt,
                verifierType,
                expectedBlockNumber,
            } as VerifierStrategy.Payload,
            JobStatus.WaitingConfirmations,
        );
    }

    private async processFinalityByChain(
        network: ConceroNetwork,
        currentChainBlock: bigint,
    ): Promise<void> {
        const waitingConfirmationJobs = await this.context.jobQueue.getList({
            status: JobStatus.WaitingConfirmations,
            srcChainSelector: Number(network.chainSelector),
        });
        const waitingConfirmationPayloads: Item[] = waitingConfirmationJobs.map(i =>
            JSON.parse(i.payload),
        );

        const messagesToVerify = waitingConfirmationPayloads.filter(
            (i: Item) =>
                i.expectedBlockNumber &&
                i.expectedBlockNumber < currentChainBlock &&
                i.parsedReceipt.srcChainSelector === Number(network.chainSelector),
        );

        const results = await Promise.allSettled(
            messagesToVerify.map(async item => {
                await this.requestVerification(
                    item.parsedReceipt.srcChainSelector,
                    item,
                    item.parsedReceipt,
                    item.verifierType,
                );
                return item;
            }),
        );
        const verifiedMessagesIds = results
            .filter(i => i.status === 'fulfilled')
            .map(i => i.value.data.messageId);

        await this.context.jobQueue.updateMany(
            { messageId: { in: verifiedMessagesIds } },
            { status: JobStatus.ProcessingRequest },
        );
    }
}
