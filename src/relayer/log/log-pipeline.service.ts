import { Abi, decodeEventLog, Hex, Log, maxUint64 } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { ParsedLog } from '../../types';
import { MessagingCodec } from '../codec';
import { ContextProvider } from '../services';
import {
    Context,
    JobPayload,
    JobStatus,
    MessageSentLogData,
    ParsedMessageLogReceipt,
} from '../types';
import { VerifierType } from '../verifier';

export class LogPipelineService extends ContextProvider {
    constructor(context: Context) {
        super('LogPipelineService', context);
    }

    // Starts log pipeline that ends src block conformations tracking:
    // 1. Parse
    // 2. Extract confirmations
    // 2. Extract verifier type
    // 3. Upsert to DB for src watcher
    async execute(network: ConceroNetwork, log: Log): Promise<void> {
        try {
            const parsedLog = this.parseLog(log, this.context.config.contract.router);
            if (!parsedLog) {
                this.logger.error(
                    `Unable to parse log [address=${log.address}, blockNumber=${String(log.blockNumber)}, chain=${network.name}]`,
                );
                return;
            }
            const parsedReceipt = MessagingCodec.decodeReceipt(parsedLog.data.messageReceipt);
            const srcBlockConfirmations = this.extractLogBlockConfirmations(parsedReceipt);
            const verifierType = this.extractLogVerifierType(parsedReceipt);
            await this.upsertLog(parsedLog, parsedReceipt, verifierType, srcBlockConfirmations);
        } catch (e) {
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

    private extractLogBlockConfirmations(parsedReceipt: ParsedMessageLogReceipt): bigint {
        if (parsedReceipt.srcChainData.blockConfirmations === 0n) {
            return this.context.deploymentManager.getMinBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        } else if (parsedReceipt.srcChainData.blockConfirmations === maxUint64) {
            return this.context.deploymentManager.getFinalityBlockConformationsByChainSelector(
                parsedReceipt.srcChainSelector,
            );
        }

        return parsedReceipt.srcChainData.blockConfirmations;
    }

    private extractLogVerifierType(parsedReceipt: ParsedMessageLogReceipt): VerifierType {
        return parsedReceipt.validatorLibs.length > 0 ? VerifierType.CRE : VerifierType.Empty;
    }

    private async upsertLog(
        parsedLog: ParsedLog<MessageSentLogData>,
        parsedReceipt: ParsedMessageLogReceipt,
        verifierType: VerifierType,
        srcBlockConfirmations: bigint,
    ): Promise<void> {
        await this.context.jobQueue.create(
            parsedLog.data.messageId,
            parsedReceipt.srcChainSelector,
            {
                ...parsedLog,
                parsedReceipt,
                verifierType,
                expectedSrcBlockNumber: srcBlockConfirmations + parsedLog.blockNumber,
            } as JobPayload,
            JobStatus.WaitingConfirmations,
        );
    }
}
