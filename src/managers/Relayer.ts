import { MessagingDeploymentManager, RelayerSetup } from './index';

import {
    BlockManagerRegistry,
    ITxMonitor,
    LoggerInterface,
    ManagerBase,
    NetworkManager,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import {
    AbiEvent,
    Log,
    decodeAbiParameters,
    encodeAbiParameters,
    getAbiItem,
    keccak256,
} from 'viem';

import { eventEmitter } from '../constants';
import { decodeLogs } from '../eventListener/decodeLogs';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { DecodedLog } from '../types/DecodedLog';
import { RelayerConfig } from '../types/ManagerConfigs';
import { decodeCLFReport, decodeMessageReportResult } from '../utils';
import { DecodedMessageReportResult } from '../utils/decoders/types';

export class Relayer extends ManagerBase {
    private static instance: Relayer | undefined;
    private readonly logger: LoggerInterface;
    private readonly networkManager: NetworkManager;
    private readonly blockManagerRegistry: BlockManagerRegistry;
    private readonly viemClientManager: ViemClientManager;
    private readonly deploymentManager: MessagingDeploymentManager;
    private readonly txReader: TxReader;
    private readonly txWriter: TxWriter;
    private readonly txMonitor: ITxMonitor;
    private readonly setup: RelayerSetup;
    private readonly config: RelayerConfig;

    private watcherIds: string[] = [];

    private sourceChainFinalityMap: Map<
        string,
        {
            decodedLog: any;
            chainSelector: string;
        }
    > = new Map();

    private destinationChainFinalityMap: Map<
        string,
        {
            chainName: string;
            messageIds: string[];
            reportSubmission: any;
            messages: string[];
            indexes: number[];
            results: DecodedMessageReportResult[];
            totalGasLimit: bigint;
        }
    > = new Map();

    private constructor(
        logger: LoggerInterface,
        networkManager: NetworkManager,
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
                txWriter: {
                    dryRun: false, // This is handled by txWriter itself
                },
            },
        );
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: NetworkManager,
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

    public static getInstance(): Relayer {
        if (!Relayer.instance) {
            throw new Error('Relayer is not initialized. Call createInstance() first.');
        }
        return Relayer.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await this.setup.executeSetup();

        await this.setupEventListeners();
        this.logger.info('Relayer initialized');
    }

    private async setupEventListeners(): Promise<void> {
        const activeNetworks = this.networkManager.getActiveNetworks();

        const sentEvent = getAbiItem({
            abi: this.config.abi.CONCERO_ROUTER,
            name: 'ConceroMessageSent',
        });

        for (const network of activeNetworks) {
            const routerAddress = await this.deploymentManager.getRouterByChainName(network.name);
            const blockManager = this.blockManagerRegistry.getBlockManager(network.name);

            if (!blockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            try {
                const watcherId = this.txReader.logWatcher.create(
                    routerAddress,
                    network,
                    async (logs, network) => {
                        if (logs.length === 0) return;

                        try {
                            await this.handleConceroMessageSent(logs, network);
                        } catch (error) {
                            this.logger.error(
                                `${network.name} Error in onLogs callback for contract ${routerAddress}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                            );
                        }
                    },
                    sentEvent as AbiEvent,
                    blockManager,
                );
                this.watcherIds.push(watcherId);
                this.logger.debug(`Created ConceroMessageSent watcher for ${network.name}`);
            } catch (error) {
                this.logger.error(
                    `Failed to set up router event listeners for ${network.name}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                );
            }
        }

        const verifierNetwork = this.networkManager.getVerifierNetwork();
        const verifierBlockManager = this.blockManagerRegistry.getBlockManager(
            verifierNetwork.name,
        );

        if (!verifierBlockManager) {
            this.logger.error(
                `No block manager available for verifier network ${verifierNetwork.name}`,
            );
            return;
        }

        const verifierAddress = await this.deploymentManager.getConceroVerifier();

        try {
            const messageReportEvent = getAbiItem({
                abi: this.config.abi.CONCERO_VERIFIER,
                name: 'MessageReport',
            });

            const watcherId = this.txReader.logWatcher.create(
                verifierAddress,
                verifierNetwork,
                async (logs, network) => {
                    if (logs.length === 0) return;

                    try {
                        await this.handleMessageReport(logs, verifierNetwork);
                    } catch (error) {
                        this.logger.error(
                            `${verifierNetwork.name} Error in onLogs callback for contract ${verifierAddress}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                        );
                    }
                },
                messageReportEvent as AbiEvent,
                verifierBlockManager,
            );
            this.watcherIds.push(watcherId);
            this.logger.debug('Created MessageReport watcher for verifier');
        } catch (error) {
            this.logger.error(
                `Failed to set up verifier event listeners: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
            );
        }
    }

    private async handleConceroMessageSent(logs: Log[], network: ConceroNetwork): Promise<void> {
        if (logs.length === 0) return;

        this.logger.debug(
            `Processing ${logs.length} ConceroMessageSent events from ${network.name}`,
        );

        try {
            const decodedLogs = decodeLogs(logs, this.config.abi.CONCERO_ROUTER);

            const immediateProcessLogs = decodedLogs.filter(
                log => !(log.args as any)?.shouldFinaliseSrc,
            );
            const finalityRequiredLogs = decodedLogs.filter(
                log => (log.args as any)?.shouldFinaliseSrc,
            );

            const immediatePromises = immediateProcessLogs.map(async decodedLog => {
                return this.processMessageReportRequest(decodedLog, network.chainSelector);
            });

            finalityRequiredLogs.forEach(decodedLog => {
                const txHash = decodedLog.transactionHash!;
                this.sourceChainFinalityMap.set(txHash, {
                    decodedLog,
                    chainSelector: network.chainSelector,
                });

                this.addFinalityTracking(txHash, network.name);
            });

            await Promise.all(immediatePromises);
        } catch (error) {
            this.logger.error(
                `Error processing logs from ${network.name}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
            );
        }
    }

    private async handleMessageReport(logs: Log[], network?: ConceroNetwork): Promise<void> {
        if (logs.length === 0) return;

        this.logger.debug(`Processing ${logs.length} MessageReport logs`);

        try {
            const decodedLogs = decodeLogs(logs, this.config.abi.CONCERO_VERIFIER);
            await this.processMessageReportSubmission(decodedLogs);
        } catch (error) {
            this.logger.error(
                `Error processing message report logs: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
            );
        }
    }

    private async processMessageReportRequest(
        decodedLog: any,
        srcChainSelector: string,
    ): Promise<void> {
        try {
            const verifierNetwork = this.networkManager.getVerifierNetwork();
            const verifierAddress = await this.deploymentManager.getConceroVerifier();

            const args = decodedLog.args as any;
            const { messageId, message, sender } = args;

            if (!messageId || !message || !sender) {
                this.logger.warn(`Missing required data in log: ${JSON.stringify(decodedLog)}`);
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
                [
                    {
                        blockNumber: BigInt(decodedLog.blockNumber || 0),
                        sender,
                    },
                ],
            );

            const txHash = await this.txWriter.callContract(verifierNetwork as any, {
                address: verifierAddress,
                abi: this.config.abi.CONCERO_VERIFIER,
                functionName: 'requestMessageReport',
                args: [messageId, keccak256(message), srcChainSelector, encodedSrcChainData],
                chain: verifierNetwork.viemChain,
            });

            if (txHash) {
                eventEmitter.emit('requestMessageReport', {
                    txHash: txHash,
                });
                this.logger.info(`CLF message report requested with hash: ${txHash}`);
            } else {
                this.logger.error(`Failed to submit CLF message report request transaction`);
            }
        } catch (error) {
            const messageId = (decodedLog.args as any)?.messageId;
            const errorNetwork = this.networkManager.getVerifierNetwork();
            this.logger.error(
                `[${errorNetwork.name}] Error requesting CLF message report for messageId ${messageId || 'unknown'}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
            );
        }
    }

    private async processMessageReportSubmission(logs: DecodedLog[]): Promise<void> {
        const activeNetworks = this.networkManager.getActiveNetworks();
        const activeNetworkNames = activeNetworks.map(network => network.name);

        try {
            const txHashToLogs = new Map<string, DecodedLog[]>();

            for (const log of logs) {
                const txHash = log.transactionHash!;
                const existingLogs = txHashToLogs.get(txHash) || [];
                existingLogs.push(log);
                txHashToLogs.set(txHash, existingLogs);
            }

            const txProcessPromises = Array.from(txHashToLogs.entries()).map(
                async ([txHash, txLogs]) => {
                    try {
                        const verifierNetwork = this.networkManager.getVerifierNetwork();
                        const { publicClient: verifierPublicClient } =
                            this.viemClientManager.getClients(verifierNetwork);

                        const messageReportTx = await verifierPublicClient.getTransaction({
                            hash: txHash as `0x${string}`,
                        });

                        const decodedCLFReport = decodeCLFReport(messageReportTx);

                        const messageResults = await this.parseMessageResults(decodedCLFReport);

                        if (messageResults.length === 0) {
                            this.logger.warn(
                                `No valid message results found in the report for transaction ${txHash}`,
                            );
                            return;
                        }

                        const messagesByDstChain = this.groupMessagesByDestination(messageResults);

                        const reportSubmission = {
                            context: decodedCLFReport.reportContext,
                            report: decodedCLFReport.reportBytes,
                            rs: decodedCLFReport.rs,
                            ss: decodedCLFReport.ss,
                            rawVs: decodedCLFReport.rawVs,
                        };

                        const dstChainProcessPromises = Array.from(
                            messagesByDstChain.entries(),
                        ).map(async ([dstChainSelector, { results, indexes }]) => {
                            const dstChain =
                                this.networkManager.getNetworkBySelector(dstChainSelector);

                            if (!activeNetworkNames.includes(dstChain.name)) {
                                this.logger.warn(
                                    `${dstChain.name} is not active. Skipping message submission.`,
                                );
                                return;
                            }

                            const dstBlockManager = this.blockManagerRegistry.getBlockManager(
                                dstChain.name,
                            );
                            if (!dstBlockManager) {
                                this.logger.error(`No BlockManager for ${dstChain.name}`);
                                return;
                            }

                            const messagePromises = results.map(result =>
                                this.fetchOriginalMessage(result, activeNetworkNames),
                            );

                            const resolvedMessages = await Promise.all(messagePromises);

                            const messages: string[] = [];
                            let totalGasLimit = BigInt(0);

                            for (const { message, gasLimit } of resolvedMessages) {
                                if (message) {
                                    messages.push(message);
                                    totalGasLimit += gasLimit;
                                }
                            }

                            if (messages.length !== results.length) {
                                this.logger.error(
                                    `[${dstChain.name}] Could only find ${messages.length}/${results.length} messages. Skipping batch submission.`,
                                );
                                return;
                            }

                            try {
                                const txHash = await this.submitBatchToDestination(
                                    dstChain,
                                    reportSubmission,
                                    messages,
                                    indexes,
                                    results,
                                    totalGasLimit,
                                );

                                const messageIds = results.map(result => result.messageId);

                                this.destinationChainFinalityMap.set(txHash, {
                                    chainName: dstChain.name,
                                    messageIds,
                                    reportSubmission,
                                    messages,
                                    indexes,
                                    results,
                                    totalGasLimit,
                                });

                                this.addFinalityTracking(txHash, dstChain.name);
                            } catch (error) {
                                this.logger.error(
                                    `Failed to submit batch to ${dstChain.name}: ${error instanceof Error ? error.message : String(error)}`,
                                );
                            }
                        });

                        await Promise.all(dstChainProcessPromises);
                    } catch (error) {
                        this.logger.error(
                            `Error processing transaction ${txHash}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                        );
                    }
                },
            );

            await Promise.all(txProcessPromises);
        } catch (e) {
            this.logger.error(
                `Error when submitting clf report: ${e instanceof Error ? e.message : String(e)}. Stack: ${e instanceof Error && e.stack ? e.stack : 'No stack trace available'}`,
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
                this.logger.error(
                    `Failed to decode result ${i}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                );
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
        activeNetworkNames: string[],
    ): Promise<{ message: string | null; gasLimit: bigint }> {
        const { srcChainSelector, messageId, srcBlockNumber } = result;
        const srcChain = this.networkManager.getNetworkBySelector(srcChainSelector.toString());

        if (!activeNetworkNames.includes(srcChain.name)) {
            this.logger.warn(
                `${srcChain.name} is not active. Skipping message with id ${messageId}`,
            );
            return { message: null, gasLimit: BigInt(0) };
        }

        const srcContractAddress = await this.deploymentManager.getRouterByChainName(srcChain.name);

        const decodedLogs = await this.txReader.getLogs(
            {
                address: srcContractAddress,
                event: getAbiItem({
                    abi: this.config.abi.CONCERO_ROUTER,
                    name: 'ConceroMessageSent',
                }) as any,
                args: {
                    messageId,
                },
                fromBlock: srcBlockNumber - BigInt(1),
                toBlock: srcBlockNumber + BigInt(1),
            },
            srcChain as any,
        );

        if (decodedLogs.length === 0) {
            this.logger.warn(
                `${srcChain.name}: No decodedLogs found for messageId ${messageId} around block ${srcBlockNumber}.`,
            );
            return { message: null, gasLimit: BigInt(0) };
        }

        const conceroMessageSentLog = decodedLogs.find(
            log =>
                (log as any).eventName === 'ConceroMessageSent' &&
                (log as any).args?.messageId?.toLowerCase() === messageId.toLowerCase(),
        );

        if (!conceroMessageSentLog) {
            this.logger.error(
                `Could not find ConceroMessageSent event with messageId ${messageId}`,
            );
            return { message: null, gasLimit: BigInt(0) };
        }

        const { message, dstChainData } = (conceroMessageSentLog as any).args;

        //todo:  use parseAbiItem
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
        )[0] as any;

        return { message, gasLimit: decodedDstChainData.gasLimit };
    }

    private async submitBatchToDestination(
        dstChain: ConceroNetwork,
        reportSubmission: any,
        messages: string[],
        indexes: number[],
        results: DecodedMessageReportResult[],
        totalGasLimit: bigint,
    ): Promise<string> {
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
            true,
        );

        const messageIds = results.map(result => result.messageId).join(', ');

        if (!txHash) {
            throw new Error(
                `[${dstChain.name}] Failed to submit batch of CLF message reports. Message IDs: ${messageIds}`,
            );
        }

        this.logger.info(
            `[${dstChain.name}] CLF Report with ${messages.length} results submitted with hash: ${txHash}`,
        );
        this.logger.debug(`[${dstChain.name}] Message IDs in batch: ${messageIds}`);

        return txHash;
    }

    private addFinalityTracking(txHash: string, chainName: string): void {
        this.txMonitor.ensureTxFinality(txHash, chainName, (txHash: string, isFinalized: boolean) =>
            this.onFinalityCallback(txHash, chainName, isFinalized),
        );
    }

    private async onFinalityCallback(
        txHash: string,
        chainName: string,
        isFinalized: boolean,
    ): Promise<void> {
        if (this.sourceChainFinalityMap.has(txHash)) {
            const context = this.sourceChainFinalityMap.get(txHash)!;
            const { decodedLog, chainSelector } = context;

            if (isFinalized) {
                await this.processMessageReportRequest(decodedLog, chainSelector);
            } else {
                this.logger.error(`Transaction ${txHash} failed to reach finality on ${chainName}`);
            }

            this.sourceChainFinalityMap.delete(txHash);
            return;
        }

        if (this.destinationChainFinalityMap.has(txHash)) {
            if (isFinalized) {
                this.destinationChainFinalityMap.delete(txHash);
            } else {
                this.retryDestinationSubmission(txHash);
            }
            return;
        }

        this.logger.error(`No context found for transaction ${txHash} on chain ${chainName}`);
    }

    private async retryDestinationSubmission(originalTxHash: string): Promise<void> {
        const context = this.destinationChainFinalityMap.get(originalTxHash);
        if (!context) {
            this.logger.error(`Cannot retry: no context found for ${originalTxHash}`);
            return;
        }

        const { chainName, reportSubmission, messages, indexes, results, totalGasLimit } = context;

        const dstChain = this.networkManager.getNetworkByName(chainName);
        if (!dstChain) {
            this.logger.error(`Cannot retry: network ${chainName} not found`);
            this.destinationChainFinalityMap.delete(originalTxHash);
            return;
        }

        const maxAttempts = 3;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                this.logger.info(
                    `[${chainName}] Retrying CLF Report submission (attempt ${attempt}/${maxAttempts}). Message IDs: ${context.messageIds.join(', ')}`,
                );

                const newTxHash = await this.submitBatchToDestination(
                    dstChain,
                    reportSubmission,
                    messages,
                    indexes,
                    results,
                    totalGasLimit,
                );

                this.destinationChainFinalityMap.delete(originalTxHash);
                this.destinationChainFinalityMap.set(newTxHash, context);
                this.addFinalityTracking(newTxHash, dstChain.name);
                return;
            } catch (error) {
                this.logger.error(
                    `Error in destination submission attempt ${attempt}/${maxAttempts} for ${originalTxHash}: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
                );
            }

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        // All attempts threw exceptions, clean up the original failed tx
        this.logger.error(
            `[${chainName}] All ${maxAttempts} submission attempts threw exceptions. Giving up. Message IDs: ${context.messageIds.join(', ')}`,
        );
        this.destinationChainFinalityMap.delete(originalTxHash);
    }
}
