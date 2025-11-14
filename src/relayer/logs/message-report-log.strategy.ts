import { ByteArray, decodeAbiParameters, Hash, Log } from 'viem';
import { ConceroNetwork, NetworkManager } from '@concero/operator-utils';
import { BaseLogStrategy } from './base-log.strategy';
import { LogStrategy } from './types';

import { globalConfig } from '../../constants';
import { DecodedLog } from '../../types/DecodedLog';
import { decodeCLFReport, decodeMessageReportResult } from '../../utils';
import { DecodedMessageReportResult } from '../../utils/decoders/types';
import { Context } from '../types';
import { ReportJobQueue } from '../verifiers/report-job-queue';

export class MessageReportLogStrategy extends BaseLogStrategy implements LogStrategy {
    private readonly reportJobQueue: ReportJobQueue;

    constructor(context: Context) {
        super('ReportLogStrategy', context);
        this.reportJobQueue = new ReportJobQueue(this.context);
    }

    async onLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        if (logs.length === 0) {
            return;
        }

        this.logger.debug(`Processing ${logs.length} MessageReport logs`);

        const activeNetworks: ConceroNetwork[] = this.context.network.getActiveNetworks();

        try {
            const parsedLogs = this.logParser.parseLogs(
                logs,
                this.context.config.contract.verifier,
            );
            const txHashToLogs = new Map<Hash, DecodedLog[]>();

            for (const log of parsedLogs) {
                const txHash = log.transactionHash;
                const existingLogs = txHashToLogs.get(txHash) || [];
                existingLogs.push(log);
                txHashToLogs.set(txHash, existingLogs);
            }

            const txProcessPromises = Array.from(txHashToLogs.entries()).map(async ([txHash]) => {
                try {
                    const { publicClient: verifierPublicClient } =
                        this.context.viemClient.getClients(this.context.verifierNetwork.name);

                    const messageReportTx = await verifierPublicClient.getTransaction({
                        hash: txHash,
                    });
                    const decodedCLFReport = decodeCLFReport(messageReportTx);

                    const messageResults = await this.parseMessageResults(decodedCLFReport);
                    if (messageResults.length === 0) {
                        this.logger.warn(
                            `No valid message results found in report for tx ${txHash}`,
                        );
                        return;
                    }
                    const allMessageIds = messageResults.map(r => r.messageId);
                    await this.reportJobQueue.cancelByMessageIds(allMessageIds);

                    const messagesByDstChain = this.groupMessagesByDestination(messageResults);

                    const reportSubmission = {
                        context: decodedCLFReport.reportContext,
                        report: decodedCLFReport.reportBytes,
                        rs: decodedCLFReport.rs,
                        ss: decodedCLFReport.ss,
                        rawVs: decodedCLFReport.rawVs,
                    };

                    const dstChainProcessPromises = Array.from(messagesByDstChain.entries()).map(
                        async ([dstChainSelector, { results, indexes }]) => {
                            const dstChain: NetworkManager =
                                this.context.network.getNetworkBySelector(dstChainSelector);

                            const dstChainIsActive = activeNetworks.some(
                                n => n.name === dstChain.name,
                            );
                            if (!dstChainIsActive) {
                                this.logger.warn(
                                    `${dstChain.name} is not active. Skipping message submission.`,
                                );
                                return;
                            }

                            try {
                                const resolved = await Promise.allSettled(
                                    results.map(r => this.fetchOriginalMessage(r, activeNetworks)),
                                );

                                const validMessages: string[] = [];
                                const validIndexes: number[] = [];
                                const validResults: any[] = [];
                                let totalGasLimit = 0n;

                                for (let i = 0; i < resolved.length; i++) {
                                    const result = resolved[i];
                                    if (result.status === 'fulfilled') {
                                        const { message, gasLimit } = result.value;
                                        if (message) {
                                            validMessages.push(message);
                                            validIndexes.push(indexes[i]);
                                            validResults.push(results[i]);
                                            totalGasLimit += gasLimit;
                                        }
                                    } else {
                                        this.logger.warn(
                                            `Failed to fetch original message for result ${i}: ${result.reason}`,
                                        );
                                    }
                                }

                                if (validMessages.length === 0) {
                                    this.logger.error(
                                        `[${dstChain.name}] Could not find any valid messages out of ${results.length} total. Skipping batch submission.`,
                                    );
                                    return;
                                }

                                if (validMessages.length !== results.length) {
                                    this.logger.warn(
                                        `[${dstChain.name}] Submitting partial batch: ${validMessages.length}/${results.length} messages (${results.length - validMessages.length} messages could not be reconstructed)`,
                                    );
                                }

                                const submissionTxHash = await this.submitBatchToDestination(
                                    dstChain,
                                    reportSubmission,
                                    validMessages,
                                    validIndexes,
                                    validResults,
                                    totalGasLimit,
                                );

                                this.context.txMonitor.trackTxFinality(
                                    submissionTxHash,
                                    dstChain.name,
                                    // @todo: move to separate polling service
                                    'relayer',
                                );
                            } catch (err) {
                                this.logger.error(
                                    `Failed to submit batch to ${dstChain.name}: ${
                                        err instanceof Error ? err.message : String(err)
                                    }`,
                                );
                            }
                        },
                    );

                    await Promise.allSettled(dstChainProcessPromises);
                } catch (err) {
                    this.logger.error(
                        `Error processing transaction ${txHash}: ${
                            err instanceof Error ? err.message : String(err)
                        }. Stack: ${err}`,
                    );
                }
            });

            await Promise.allSettled(txProcessPromises);
        } catch (e) {
            this.logger.error(
                `Error when processing MessageReport logs: ${
                    e instanceof Error ? e.message : String(e)
                }. Stack: ${e instanceof Error && e.stack ? e.stack : 'No stack trace available'}`,
            );
        }
    }

    private async parseMessageResults(
        decodedCLFReport: any,
    ): Promise<DecodedMessageReportResult[]> {
        const messageResults: DecodedMessageReportResult[] = [];

        for (let i = 0; i < decodedCLFReport.report.results.length; i++) {
            try {
                const decodedResult = decodeMessageReportResult(decodedCLFReport.report.results[i]);
                messageResults.push(decodedResult);
            } catch (error) {
                this.logger.error(`Failed to decode result ${i}: ${error}`);
            }
        }

        return messageResults;
    }

    private groupMessagesByDestination(messageResults: DecodedMessageReportResult[]) {
        const messagesByDstChain = new Map<
            string,
            {
                results: DecodedMessageReportResult[];
                indexes: number[];
            }
        >();

        messageResults.forEach((result, index) => {
            const dstChainSelector = result.dstChainSelector.toString();

            if (!messagesByDstChain.has(dstChainSelector)) {
                messagesByDstChain.set(dstChainSelector, { results: [result], indexes: [index] });
            } else {
                messagesByDstChain.get(dstChainSelector)!.results.push(result);
                messagesByDstChain.get(dstChainSelector)!.indexes.push(index);
            }
        });

        return messagesByDstChain;
    }

    private async fetchOriginalMessage(
        result: DecodedMessageReportResult,
        activeNetworks: { name: string }[],
    ): Promise<{ message: string | null; gasLimit: bigint }> {
        const { srcChainSelector, messageId, srcBlockNumber } = result;
        const srcChain: ConceroNetwork = this.context.network.getNetworkBySelector(
            srcChainSelector.toString(),
        );

        const srcIsActive = activeNetworks.some(n => n.name === srcChain.name);
        if (!srcIsActive) {
            this.logger.warn(
                `${srcChain.name} is not active. Skipping message with id ${messageId}`,
            );
            return { message: null, gasLimit: 0n };
        }

        const srcContractAddress = await this.context.messagingDeployment.getRouterByChainName(
            srcChain.name,
        );

        const decodedLogs = await this.context.txReader.getLogs(
            {
                address: srcContractAddress,
                event: this.context.config.event.messageSent,
                args: { messageId },
                fromBlock: srcBlockNumber - 1n,
                toBlock: srcBlockNumber + 1n,
            },
            srcChain,
        );

        if (decodedLogs.length === 0) {
            this.logger.warn(
                `${srcChain.name}: No decodedLogs found for messageId ${messageId} around block ${srcBlockNumber}.`,
            );
            return { message: null, gasLimit: 0n };
        }

        const conceroMessageSentLog = decodedLogs.find(
            log =>
                log.eventName === 'ConceroMessageSent' &&
                (log.args as any)?.messageId?.toLowerCase() === messageId.toLowerCase(),
        );

        if (!conceroMessageSentLog) {
            this.logger.error(
                `Could not find ConceroMessageSent event with messageId ${messageId}`,
            );
            return { message: null, gasLimit: 0n };
        }

        const { message, dstChainData } = conceroMessageSentLog.args as {
            message: string;
            dstChainData: Hash | ByteArray;
        };

        const decodedDstChainData = decodeAbiParameters(
            [
                {
                    type: 'tuple',
                    components: [
                        { name: 'receiver', type: 'address' },
                        { name: 'gasLimit', type: 'uint256' },
                    ],
                },
            ],
            dstChainData,
        )[0];

        return { message, gasLimit: decodedDstChainData.gasLimit };
    }

    private async submitBatchToDestination(
        dstChain: ConceroNetwork,
        reportSubmission: any,
        messages: string[],
        indexes: number[] | bigint[],
        results: DecodedMessageReportResult[],
        totalGasLimit: bigint,
    ): Promise<Hash> {
        const dstConceroRouter = await this.context.messagingDeployment.getRouterByChainName(
            dstChain.name,
        );

        const txHash = await this.context.txWriter.callContract(
            dstChain,
            {
                address: dstConceroRouter,
                abi: this.context.config.contract.router,
                functionName: 'submitMessageReport',
                args: [reportSubmission, messages, indexes.map(index => BigInt(index))],
                chain: dstChain.viemChain,
                gas:
                    totalGasLimit +
                    BigInt(messages.length) *
                        globalConfig.RELAYER.gasLimit.submitMessageReportOverhead,
            },
            false,
        );

        const messageIds = results.map(result => result.messageId).join(', ');

        if (!txHash) {
            throw new Error(
                `[${dstChain.name}] Failed to submit batch of CLF message reports. Message IDs: ${messageIds}`,
            );
        }

        this.logger.info(
            `[${dstChain.name}] Report submitted with ${messages.length} msgs, tx: ${txHash}`,
        );
        this.logger.debug(`[${dstChain.name}] Message IDs in batch: ${messageIds}`);

        return txHash;
    }
}

export namespace MessageReportLogStrategy {}
