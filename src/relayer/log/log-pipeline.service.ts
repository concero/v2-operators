import { Abi, Address, decodeEventLog, Hex, Log } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { DecodedMessageSentReceipt, JobStatus, MessageSentLogData, ParsedLog } from '../../types';
import { MessagingCodec } from '../../utils';
import { ContextProvider } from '../services';
import { Context, ValidatorType } from '../types';

export class LogPipelineService extends ContextProvider {
    constructor(context: Context) {
        super('LogPipelineService', context);
    }

    // Starts log pipeline that ends src block conformations tracking:
    // 1. Parse
    // 2. Extract dst/src confirmations
    // 2. Extract verifier type
    // 3. Upsert to DB for src watcher

    async execute(network: ConceroNetwork, log: Log): Promise<void> {
        try {
            const parsedLog = this.parseLog(log, this.context.config.routerContractAbi);
            if (!parsedLog) {
                this.logger.error(
                    `Unable to parse log [address=${log.address}, blockNumber=${String(log.blockNumber)}, chain=${network.name}]`,
                );
                return;
            }
            const parsedReceipt = MessagingCodec.decodeReceipt(parsedLog.data.messageReceipt);
            const validatorType = this.extractLogValidatorType(parsedLog.data.validatorLibs);
            await this.upsertLog(parsedLog, parsedReceipt, validatorType);
        } catch (e) {
            // @todo upsert raw log to reparse & restart
            this.logger.error(`Unhandled error: ${e}`);
        }
    }

    private parseLog(log: Log, abi: Abi): ParsedLog<MessageSentLogData> | null {
        try {
            const decoded = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true,
            });
            return {
                eventHash: log.topics?.[0] as Hex,
                eventName: decoded.eventName as unknown as string,
                data: decoded.args as unknown as MessageSentLogData,
                blockNumber: log.blockNumber as bigint,
                transactionHash: log.transactionHash as Hex,
            };
        } catch (error) {
            this.logger.error(`Log parsing failed: ${error}`);
            return null;
        }
    }

    private extractLogValidatorType(validatorLibs: Address[]): ValidatorType {
        return validatorLibs.length > 0 ? ValidatorType.CRE : ValidatorType.Empty;
    }

    private async upsertLog(
        parsedLog: ParsedLog<MessageSentLogData>,
        parsedReceipt: DecodedMessageSentReceipt,
        validatorType: ValidatorType,
    ): Promise<void> {
        await this.context.jobQueue.create({
            messageId: parsedLog.data.messageId,
            status: JobStatus.WaitingSrcConfirmation,
            callbacksCount: 0,
            validatorType,
            payload: { data: parsedLog.data, parsedReceipt },
            // src
            srcTxHash: parsedLog.transactionHash,
            srcBlockNumber: String(parsedLog.blockNumber),
            srcChainSelector: parsedReceipt.srcChainSelector,
            // dst
            dstTxHash: null,
            dstBlockNumber: null,
            dstChainSelector: parsedReceipt.dstChainSelector,
        });
    }
}
