import { Hex, Log } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseLogStrategy } from './base-log.strategy';
import { LogStrategy } from './types';

import { MessagingCodec } from '../../utils';
import { Context } from '../types';
import { VerifierProcessor, VerifierType } from '../verifiers';

export class MessageSentLogStrategy extends BaseLogStrategy implements LogStrategy {
    constructor(context: Context) {
        super('MessageSentLogStrategy', context);
    }

    async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        try {
            if (logs.length === 0) {
                return;
            }

            this.logger.debug(
                `Processing ${logs.length} ConceroMessageSent events from ${network.name}`,
            );

            const parsedLogs = this.logParser.parseLogs<MessageSentLogStrategy.MessageSentData>(
                logs,
                this.context.config.contract.router,
            );

            for (const parsedLog of parsedLogs) {
                const parsedLogReceipt = MessagingCodec.decodeReceipt(
                    Buffer.from(parsedLog.data.messageReceipt),
                );

                const shouldFinaliseSrc = parsedLogReceipt.srcBlockConfirmations !== 0n;
                if (shouldFinaliseSrc) {
                    this.context.txMonitor.trackTxFinality(
                        parsedLog.transactionHash,
                        network.name,
                        // @todo: move to separate polling service
                        'relayer',
                    );
                } else {
                    this.context.eventEmitter.emit(VerifierProcessor.RequestMessageReport.command, {
                        messageId: parsedLog.data.messageId,
                        sender: parsedLogReceipt.msgSender,
                        blockNumber: parsedLog.blockNumber,
                        chainSelector: network.chainSelector,
                        chainName: network.viemChain.name,
                        data: parsedLogReceipt.payload.toString(),
                        type: VerifierType.CRE,
                    } as VerifierProcessor.RequestMessageReport.Payload);
                }
            }
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }
}

export namespace MessageSentLogStrategy {
    export type MessageSentData = {
        messageId: Hex;
        messageReceipt: Hex;
    };
}
