import {
    Address,
    ByteArray,
    decodeAbiParameters,
    encodeAbiParameters,
    getAbiItem,
    Hash,
    keccak256,
    Log,
} from 'viem';
import {
    BlockManagerRegistry,
    ConceroNetworkManager,
    ITxMonitor,
    LoggerInterface,
    ManagerBase,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { MessagingDeploymentManager, RelayerSetup } from './index';
import { PrismaClient } from '@prisma/client';

import { eventEmitter } from '../constants';
import { DecodedLog } from '../types';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { RelayerConfig } from '../types/ManagerConfigs';
import { decodeCLFReport, decodeMessageReportResult } from '../utils';
import { decodeLogs } from '../utils/decodeLogs';
import { DecodedMessageReportResult } from '../utils/decoders/types';
import { RelayerJobQueue } from '../utils/RelayerJobQueue';

export class Relayer extends ManagerBase {
    private static instance: Relayer | undefined;
    private readonly logger: LoggerInterface;
    private readonly networkManager: ConceroNetworkManager;
    private readonly blockManagerRegistry: BlockManagerRegistry;
    private readonly viemClientManager: ViemClientManager;
    private readonly deploymentManager: MessagingDeploymentManager;
    private readonly txReader: TxReader;
    private readonly txWriter: TxWriter;
    private readonly txMonitor: ITxMonitor;
    private readonly setup: RelayerSetup;
    private readonly config: RelayerConfig;
    private prisma = new PrismaClient();
    private jobQueue = new RelayerJobQueue(this.prisma);

    private verifierNetwork!: ConceroNetwork;
    private verifierAddress!: Address;

    private constructor(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        blockManagerRegistry: BlockManagerRegistry,
        viemClientManager: ViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txReader: TxReader,
        txWriter: TxWriter,
        txMonitor: ITxMonitor,
        config: RelayerConfig,
    ) {
        super();
        this.logger = logger;
        this.networkManager = networkManager;
        this.blockManagerRegistry = blockManagerRegistry;
        this.viemClientManager = viemClientManager;
        this.deploymentManager = deploymentManager;
        this.txReader = txReader;
        this.txWriter = txWriter;
        this.txMonitor = txMonitor;
        this.config = config;

        this.setup = RelayerSetup.createInstance(
            logger,
            networkManager,
            viemClientManager,
            deploymentManager,
            txWriter,
            {
                abi: config.abi,
                operatorAddress: config.operatorAddress,
            },
        );
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        blockManagerRegistry: BlockManagerRegistry,
        viemClientManager: ViemClientManager,
        deploymentManager: MessagingDeploymentManager,
        txReader: TxReader,
        txWriter: TxWriter,
        txMonitor: ITxMonitor,
        config: RelayerConfig,
    ): Relayer {
        if (!Relayer.instance) {
            Relayer.instance = new Relayer(
                logger,
                networkManager,
                blockManagerRegistry,
                viemClientManager,
                deploymentManager,
                txReader,
                txWriter,
                txMonitor,
                config,
            );
        }
        return Relayer.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.verifierNetwork = this.networkManager.getVerifierNetwork();
        this.verifierAddress = await this.deploymentManager.getConceroVerifier();

        await this.setup.executeSetup();

        await this.setupEventListeners();
        setInterval(async () => {
            const jobs = await this.jobQueue.getDue(10);

            for (const job of jobs) {
                if (job.jobType === 'report-request') {
                    try {
                        const ctx = JSON.parse(job.payload);
                        this.logger.info(
                            `Job retry #${job.attempts + 1} for messageId=${job.messageId}`,
                        );
                        await this.requestMessageReport(ctx.decodedLog, ctx.srcChainSelector);
                    } catch (err) {
                        this.logger.error(`[report-request] error: ${err}`);
                    } finally {
                        await this.jobQueue.reschedule(job.id, job.attempts);
                    }
                    continue;
                }

                const ctx = JSON.parse(job.payload);
                const { chainName, reportSubmission, messages, indexes, results, totalGasLimit } =
                    ctx;
                const dstChain = this.networkManager.getNetworkByName(chainName);
                if (!dstChain) {
                    this.logger.error(`[${chainName}] Retry failed: no network`);
                    await this.jobQueue.markFailed(job.id, job.attempts);
                    continue;
                }

                try {
                    this.logger.info(
                        `[${chainName}] Retrying job ${job.id} (attempt ${job.attempts + 1})`,
                    );
                    const newTxHash = await this.submitBatchToDestination(
                        dstChain,
                        reportSubmission,
                        messages,
                        indexes,
                        results,
                        totalGasLimit,
                    );
                    this.logger.info(`[${chainName}] Retry success: ${newTxHash}`);
                    await this.jobQueue.markSuccess(job.id);
                } catch (err) {
                    this.logger.error(`[${chainName}] Retry error: ${err}`);
                    await this.jobQueue.markFailed(job.id, job.attempts + 1);
                }
            }
        }, 15_000);

        this.logger.info('initialized');
    }

    private async setupEventListeners(): Promise<void> {
        const activeNetworks = this.networkManager.getActiveNetworks();

        const handleMessageReportLogs = this.handleMessageReportLogs.bind(this);
        const handleMessageSentLogs = this.handleMessageSentLogs.bind(this);

        const sentEventAbi = getAbiItem({
            abi: this.config.abi.CONCERO_ROUTER,
            name: 'ConceroMessageSent',
        });

        for (const network of activeNetworks) {
            const routerAddress = this.deploymentManager.getRouterByChainName(network.name);
            const blockManager = this.blockManagerRegistry.getBlockManager(network.name);

            if (!blockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            try {
                const watcherId = await this.txReader.logWatcher.create(
                    routerAddress,
                    network,
                    handleMessageSentLogs,
                    sentEventAbi,
                    blockManager,
                );
                this.logger.debug(`Created ConceroMessageSent watcher for ${network.name}`);
            } catch (error) {
                this.logger.error(
                    `Failed to set up router event listeners for ${network.name}: ${error}`,
                );
            }
        }

        const verifierBlockManager = this.blockManagerRegistry.getBlockManager(
            this.verifierNetwork.name,
        );

        if (!verifierBlockManager) {
            this.logger.error(
                `No block manager available for verifier network ${this.verifierNetwork.name}`,
            );
            return;
        }

        try {
            const messageReportEventAbi = getAbiItem({
                abi: this.config.abi.CONCERO_VERIFIER,
                name: 'MessageReport',
            });

            const watcherId = await this.txReader.logWatcher.create(
                this.verifierAddress,
                this.verifierNetwork,
                handleMessageReportLogs,
                messageReportEventAbi,
                verifierBlockManager,
            );
            this.logger.debug('Created MessageReport watcher for verifier');
        } catch (error) {
            this.logger.error(`Failed to set up verifier event listeners: ${error}`);
        }
    }

    private async handleMessageSentLogs(logs: Log[], network: ConceroNetwork): Promise<void> {
        if (logs.length === 0) return;

        this.logger.debug(
            `Processing ${logs.length} ConceroMessageSent events from ${network.name}`,
        );

        try {
            const decodedLogs = decodeLogs(logs, this.config.abi.CONCERO_ROUTER);

            const immediateProcessLogs = decodedLogs.filter(
                log => log.args?.shouldFinaliseSrc === false,
            );

            const finalityRequiredLogs = decodedLogs.filter(
                log => log.args?.shouldFinaliseSrc === true,
            );

            finalityRequiredLogs.forEach(decodedLog => {
                const txHash = decodedLog.transactionHash!;

                this.txMonitor.trackTxFinality(
                    txHash,
                    network.name,
                    //todo
                    'relayer',
                );
            });

            for (const log of immediateProcessLogs) {
                void this.requestMessageReport(log, network.chainSelector); // @dev: not awaiting to avoid blocking
            }
        } catch (error) {
            this.logger.error(`Error processing logs from ${network.name}: ${error}`);
        }
    }

    private async handleMessageReportLogs(logs: Log[]): Promise<void> {
        if (logs.length === 0) return;

        this.logger.debug(`Processing ${logs.length} MessageReport logs`);

        const activeNetworks = this.networkManager.getActiveNetworks();

        try {
            const decodedLogs = decodeLogs(logs, this.config.abi.CONCERO_VERIFIER);
            const txHashToLogs = new Map<Hash, DecodedLog[]>();

            for (const log of decodedLogs) {
                const txHash = log.transactionHash!;
                const existingLogs = txHashToLogs.get(txHash) || [];
                existingLogs.push(log);
                txHashToLogs.set(txHash, existingLogs);
            }

            const txProcessPromises = Array.from(txHashToLogs.entries()).map(async ([txHash]) => {
                try {
                    const { publicClient: verifierPublicClient } =
                        this.viemClientManager.getClients(this.verifierNetwork.name);

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
                    await this.jobQueue.cancelByMessageIds(allMessageIds);

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
                            const dstChain =
                                this.networkManager.getNetworkBySelector(dstChainSelector);

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

                                const messageIds = validResults.map(r => r.messageId);

                                this.txMonitor.trackTxFinality(
                                    submissionTxHash,
                                    dstChain.name,
                                    //todo
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

    private async requestMessageReport(
        decodedLog: DecodedLog,
        srcChainSelector: string,
    ): Promise<void> {
        try {
            const args = decodedLog.args;
            const { messageId, message, sender } = args as unknown as {
                messageId: string;
                message: Hash | ByteArray;
                sender: Hash;
            };
            if (!messageId || !message || !sender || !decodedLog.blockNumber) {
                this.logger.error(`Missing required data in log: ${decodedLog}`);
                return;
            }

            const encodedSrcChainData = encodeAbiParameters(
                [
                    {
                        type: 'tuple',
                        components: [
                            { name: 'blockNumber', type: 'uint256' },
                            { name: 'sender', type: 'address' },
                        ],
                    },
                ],
                [{ blockNumber: BigInt(decodedLog.blockNumber), sender }],
            );

            const txHash = await this.txWriter.callContract(this.verifierNetwork, {
                address: this.verifierAddress,
                abi: this.config.abi.CONCERO_VERIFIER,
                functionName: 'requestMessageReport',
                args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
                chain: this.verifierNetwork.viemChain,
            });

            await this.jobQueue.add(
                messageId,
                this.verifierNetwork.name,
                { decodedLog, srcChainSelector },
                60,
            );

            eventEmitter.emit('requestMessageReport', { txHash });
            this.logger.info(`Report requested, tx: ${txHash}`);
        } catch (error) {
            const messageId = decodedLog.args?.messageId;
            this.logger.error(
                `[${this.verifierNetwork.name}] Error requesting report for messageId ${messageId || 'unknown'}: ${error}`,
            );

            await this.jobQueue.upsertReportRequest(
                decodedLog.args?.messageId ?? 'unknown',
                this.verifierNetwork.name,
                {
                    decodedLog,
                    srcChainSelector,
                },
                60,
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
                messagesByDstChain.set(dstChainSelector, { results: [], indexes: [] });
            }

            messagesByDstChain.get(dstChainSelector)!.results.push(result);
            messagesByDstChain.get(dstChainSelector)!.indexes.push(index);
        });

        return messagesByDstChain;
    }

    private async fetchOriginalMessage(
        result: DecodedMessageReportResult,
        activeNetworks: { name: string }[],
    ): Promise<{ message: string | null; gasLimit: bigint }> {
        const { srcChainSelector, messageId, srcBlockNumber } = result;
        const srcChain = this.networkManager.getNetworkBySelector(srcChainSelector.toString());

        const srcIsActive = activeNetworks.some(n => n.name === srcChain.name);
        if (!srcIsActive) {
            this.logger.warn(
                `${srcChain.name} is not active. Skipping message with id ${messageId}`,
            );
            return { message: null, gasLimit: 0n };
        }

        const srcContractAddress = this.deploymentManager.getRouterByChainName(srcChain.name);

        const decodedLogs = await this.txReader.getLogs(
            {
                address: srcContractAddress,
                event: getAbiItem({
                    abi: this.config.abi.CONCERO_ROUTER,
                    name: 'ConceroMessageSent',
                }),
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
                log.args?.messageId?.toLowerCase() === messageId.toLowerCase(),
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
        const dstConceroRouter = await this.deploymentManager.getRouterByChainName(dstChain.name);

        const txHash = await this.txWriter.callContract(
            dstChain,
            {
                address: dstConceroRouter,
                abi: this.config.abi.CONCERO_ROUTER,
                functionName: 'submitMessageReport',
                args: [reportSubmission, messages, indexes.map(index => BigInt(index))],
                chain: dstChain.viemChain,
                gas:
                    totalGasLimit +
                    BigInt(messages.length) * this.config.gasLimit.submitMessageReportOverhead,
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
