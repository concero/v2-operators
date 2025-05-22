import { AbiEvent, Address, Log, TransactionReceipt, decodeEventLog, toEventSelector } from "viem";

import { randomUUID } from "crypto";

import { globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxManager } from "../../types/managers/ITxManager";
import { callContract as genericCallContract } from "../utils/callContract";
import { logger } from "../utils/logger";

import { BlockManagerRegistry } from "./BlockManagerRegistry";
import { ManagerBase } from "./ManagerBase";
import { NetworkManager } from "./NetworkManager";
import { TxMonitor } from "./TxMonitor";
import { ViemClientManager } from "./ViemClientManager";

export interface LogQuery {
    address: Address;
    fromBlock: bigint;
    toBlock: bigint;
    event?: AbiEvent;
}

export interface TxSubmissionParams {
    contractAddress: Address;
    abi: any;
    functionName: string;
    args: any[];
    chain: ConceroNetwork;
    messageId?: string;
    options?: {
        skipSimulation?: boolean;
        receiptTimeout?: number;
        receiptConfirmations?: number;
        gas?: bigint;
    };
}

export interface TxAttempt {
    txHash: string;
    submissionBlock: bigint | null;
    submittedAt: number;
    status: "pending" | "confirmed" | "finalized" | "dropped" | "failed";
}

export enum TxType {
    ConceroSent = "ConceroSent",
    RequestMessageReport = "RequestMessageReport",
    SubmitMessageReport = "SubmitMessageReport",
    Other = "Other",
}

export interface ManagedTx {
    id: string;
    messageId?: string;
    chainName: string;
    type: TxType;
    params: TxSubmissionParams;
    attempts: TxAttempt[];
    retryCount: number;
    lastChecked: number;
    decodedEvents?: any[];
}

export interface LogResult extends Log {
    chainName: string;
    decodedLog?: unknown;
}

export interface LogWatcher {
    id: string;
    contractAddress: Address;
    chainName: string;
    event?: AbiEvent;
    onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>;
}

export class TxManager extends ManagerBase implements ITxManager {
    private static instance: TxManager;

    private transactions: Map<string, ManagedTx> = new Map();
    private txByType: Map<TxType, Set<string>> = new Map([
        [TxType.ConceroSent, new Set()],
        [TxType.RequestMessageReport, new Set()],
        [TxType.SubmitMessageReport, new Set()],
        [TxType.Other, new Set()],
    ]);
    private txHashToId: Map<string, string> = new Map();

    public logWatchers: Map<string, LogWatcher> = new Map();
    private cachedLogs: Map<
        string, // contract address
        Map<
            string, // event name (or empty string for all)
            LogResult[]
        >
    > = new Map();
    private blockManagerUnwatchers: Map<string, () => void> = new Map();

    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;
    private blockManagerRegistry: BlockManagerRegistry;
    private txMonitor!: TxMonitor;

    private constructor(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
    ) {
        super();
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
    }

    public static createInstance(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        blockManagerRegistry: BlockManagerRegistry,
    ): TxManager {
        TxManager.instance = new TxManager(networkManager, viemClientManager, blockManagerRegistry);
        return TxManager.instance;
    }

    public static getInstance(): TxManager {
        if (!TxManager.instance) {
            throw new Error("TxManager is not initialized. Call createInstance() first.");
        }
        return TxManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            this.txMonitor = TxMonitor.createInstance(this, this.viemClientManager);

            const networks = this.networkManager.getActiveNetworks();
            for (const network of networks) {
                await this.subscribeToBlockUpdates(network);
            }

            await super.initialize();
            logger.info(
                "[TxManager]: Initialized transaction manager and started block monitoring",
            );
        } catch (error) {
            logger.error("[TxManager]: Failed to initialize", error);
            throw error;
        }
    }

    private async subscribeToBlockUpdates(network: ConceroNetwork): Promise<void> {
        const blockManager = this.blockManagerRegistry.getBlockManager(network.name);
        if (!blockManager) {
            logger.warn(`[TxManager]: No BlockManager available for ${network.name}`);
            return;
        }

        const unwatcher = blockManager.watchBlocks({
            onBlockRange: async (startBlock: bigint, endBlock: bigint) => {
                await this.processNewBlocks(network, startBlock, endBlock);
            },
            onError: err => {
                logger.error(`[TxManager]: Block polling error for ${network.name}`, err);
            },
        });

        this.blockManagerUnwatchers.set(network.name, unwatcher);
    }

    private async processNewBlocks(
        network: ConceroNetwork,
        startBlock: bigint,
        endBlock: bigint,
    ): Promise<void> {
        try {
            await this.txMonitor.checkTransactionsInRange(network, startBlock, endBlock);
            await this.fetchLogsForWatchers(network, startBlock, endBlock);
        } catch (error) {
            logger.error(
                `[TxManager]: Error processing blocks ${startBlock}-${endBlock} for ${network.name}:`,
                error,
            );
        }
    }

    private updateTxStatus(txHash: string, status: string): ManagedTx | null {
        const tx = this.findTransactionByHash(txHash);
        if (!tx) return null;

        for (const attempt of tx.attempts) {
            if (attempt.txHash === txHash) {
                attempt.status = status;
                break;
            }
        }

        return tx;
    }

    public async onTxReorg(txHash: string, chainName: string): Promise<string | null> {
        const tx = this.findTransactionByHash(txHash);
        if (!tx) {
            logger.warn(`[TxManager]: Transaction ${txHash} not found for resubmission`);
            return null;
        }

        logger.info(
            `[TxManager]: Resubmitting transaction ${txHash} (logical id: ${tx.id}) due to reorg on ${chainName}`,
        );

        this.unregisterTx(tx);

        try {
            const newTx = await this.callContract(tx.params);

            if (tx.messageId) {
                newTx.messageId = tx.messageId;
                this.registerTx(newTx);
            }

            return newTx.attempts[0]?.txHash || null;
        } catch (error) {
            logger.error(`[TxManager]: Failed to resubmit transaction after reorg`, error);
            return null;
        }
    }

    public onTxFinality(txHash: string, chainName: string): void {
        const tx = this.updateTxStatus(txHash, "finalized");
        if (!tx) {
            logger.warn(`[TxManager]: Finalized transaction ${txHash} not found in tracking maps`);
            return;
        }

        logger.debug(
            `[TxManager]: Transaction ${txHash} (logical id: ${tx.id}) has reached finality on ${chainName}`,
        );

        if (tx.attempts.every(a => a.status === "finalized" || a.status === "failed")) {
            this.unregisterTx(tx);
        }
    }

    public logWatcher = {
        create: (
            contractAddress: Address,
            chainName: string,
            onLogs: (logs: LogResult[], network: ConceroNetwork) => Promise<void>,
            event?: AbiEvent,
        ): string => {
            const watcherId = randomUUID();

            const watcher: LogWatcher = {
                id: watcherId,
                contractAddress,
                chainName,
                event,
                onLogs,
            };

            this.logWatchers.set(watcherId, watcher);

            return watcherId;
        },

        remove: (watcherId: string): boolean => {
            const result = this.logWatchers.delete(watcherId);

            if (result) {
                logger.info(`[TxManager]: Removed log watcher ${watcherId}`);
            } else {
                logger.warn(
                    `[TxManager]: Attempted to remove non-existent log watcher ${watcherId}`,
                );
            }

            return result;
        },

        getByAddress: (address: Address): LogWatcher[] => {
            return Array.from(this.logWatchers.values()).filter(
                watcher => watcher.contractAddress === address,
            );
        },
    };

    private async fetchLogsForWatchers(
        network: ConceroNetwork,
        startBlock: bigint,
        endBlock: bigint,
    ): Promise<void> {
        const watchersByAddress = new Map<string, LogWatcher[]>();

        for (const watcher of this.logWatchers.values()) {
            if (watcher.chainName !== network.name) continue;

            const watchers = watchersByAddress.get(watcher.contractAddress) || [];
            watchers.push(watcher);
            watchersByAddress.set(watcher.contractAddress, watchers);
        }

        for (const [address, watchers] of watchersByAddress.entries()) {
            try {
                const query: LogQuery = {
                    address: address as Address,
                    fromBlock: startBlock,
                    toBlock: endBlock,
                };

                // Fetch logs from chain
                const { publicClient } = this.viemClientManager.getClients(network);
                let logs;
                try {
                    logs = await publicClient.getLogs({
                        address: query.address,
                        fromBlock: query.fromBlock,
                        toBlock: query.toBlock,
                    } as any);
                } catch (error) {
                    logger.error(`[TxManager]: Error fetching logs for ${network.name}`, error);
                    continue;
                }

                if (!logs || logs.length === 0) continue;

                logger.debug(
                    `[TxManager]: Found ${logs.length} logs for contract ${address} on ${network.name} in blocks ${startBlock}-${endBlock}`,
                );

                // Store logs in nested cache by contract address and event name
                let contractLogs = this.cachedLogs.get(address);
                if (!contractLogs) {
                    contractLogs = new Map();
                    this.cachedLogs.set(address, contractLogs);
                }

                // Decode and distribute logs to watchers
                for (const watcher of watchers) {
                    let filteredLogs: LogResult[] = [];
                    const eventName = watcher.event?.name || "";

                    if (watcher.event) {
                        const eventTopic = toEventSelector(watcher.event);
                        filteredLogs = logs
                            .filter(log => log.topics[0] === eventTopic)
                            .map(log => {
                                const result: LogResult = {
                                    address: address as Address,
                                    data: log.data,
                                    topics: [...log.topics],
                                    blockNumber: log.blockNumber,
                                    transactionHash: log.transactionHash,
                                    logIndex: log.logIndex ?? 0,
                                    removed: false,
                                    chainName: network.name,
                                };
                                try {
                                    result.decodedLog = decodeEventLog({
                                        abi: [watcher.event!],
                                        data: log.data,
                                        topics: log.topics as unknown as [
                                            `0x${string}`,
                                            ...`0x${string}`[],
                                        ],
                                    });
                                } catch (error) {
                                    logger.debug(
                                        `[TxManager]: Error decoding log for ${network.name}`,
                                        error,
                                    );
                                }
                                return result;
                            });
                    } else {
                        filteredLogs = logs.map(log => ({
                            address: address as Address,
                            data: log.data,
                            topics: [...log.topics],
                            blockNumber: log.blockNumber,
                            transactionHash: log.transactionHash,
                            logIndex: log.logIndex ?? 0,
                            removed: false,
                            chainName: network.name,
                        }));
                    }

                    // Store in cache
                    let eventLogs = contractLogs.get(eventName);
                    if (!eventLogs) {
                        eventLogs = [];
                        contractLogs.set(eventName, eventLogs);
                    }
                    eventLogs.push(...filteredLogs);

                    if (filteredLogs.length > 0) {
                        try {
                            await watcher.onLogs(filteredLogs, network);
                        } catch (error) {
                            logger.error(
                                `[TxManager]: Error in log watcher ${watcher.id} for contract ${address}:`,
                                error,
                            );
                        }
                    }
                }
            } catch (error) {
                logger.error(
                    `[TxManager]: Error processing logs for contract ${address} on ${network.name}:`,
                    error,
                );
            }
        }
    }

    private findTransactionByHash(txHash: string): ManagedTx | null {
        const txId = this.txHashToId.get(txHash);
        return txId ? this.transactions.get(txId) || null : null;
    }

    private registerTx(tx: ManagedTx): void {
        this.transactions.set(tx.id, tx);
        const typeSet = this.txByType.get(tx.type);
        if (typeSet) {
            typeSet.add(tx.id);
        }

        for (const attempt of tx.attempts) {
            this.txHashToId.set(attempt.txHash, tx.id);
        }
    }

    private unregisterTx(tx: ManagedTx): void {
        this.transactions.delete(tx.id);
        const typeSet = this.txByType.get(tx.type);
        if (typeSet) {
            typeSet.delete(tx.id);
        }

        for (const attempt of tx.attempts) {
            this.txHashToId.delete(attempt.txHash);
        }
    }

    private async determineTxType(
        functionName: string,
        contractAddress: Address,
        chainName: string,
    ): Promise<TxType> {
        const deploymentManager = await (
            await import("./DeploymentManager")
        ).DeploymentManager.getInstance();

        let isRouter = false;
        try {
            const routerAddress = await deploymentManager.getRouterByChainName(chainName);
            isRouter = routerAddress.toLowerCase() === contractAddress.toLowerCase();
        } catch {}

        let isVerifier = false;
        try {
            const verifierAddress = await deploymentManager.getConceroVerifier();
            isVerifier = verifierAddress.toLowerCase() === contractAddress.toLowerCase();
        } catch {}

        if (isRouter) {
            if (functionName === "ConceroMessageSent") {
                return TxType.ConceroSent;
            }
            if (functionName === "ConceroMessageReceived") {
                return TxType.ConceroSent;
            }
        } else if (isVerifier) {
            if (functionName === "MessageReportRequested") {
                return TxType.RequestMessageReport;
            }
            if (functionName === "MessageReport") {
                return TxType.SubmitMessageReport;
            }
        }
        return TxType.Other;
    }

    public getClients(network: ConceroNetwork) {
        return this.viemClientManager.getClients(network);
    }

    public async callContract(params: TxSubmissionParams): Promise<ManagedTx> {
        const id = randomUUID();
        const type = await this.determineTxType(
            params.functionName,
            params.contractAddress,
            params.chain.name,
        );

        let txHash: string | null = null;
        let submissionBlock: bigint | null = null;
        let receipt: TransactionReceipt | null = null;

        logger.debug(
            `[TxManager]: Calling contract ${params.contractAddress} on ${params.chain.name} - function: ${params.functionName}`,
        );

        try {
            const { publicClient, walletClient, account } = this.viemClientManager.getClients(
                params.chain,
            );

            const contractParams = {
                chain: params.chain.viemChain,
                address: params.contractAddress as Address,
                abi: params.abi,
                functionName: params.functionName,
                args: params.args,
                account: account as any,
                gas: params.options?.gas ?? globalConfig.VIEM.WRITE_CONTRACT.gas,
            };

            txHash = await genericCallContract(publicClient, walletClient, contractParams);

            receipt = await publicClient.waitForTransactionReceipt({
                hash: txHash as `0x${string}`,
                confirmations:
                    params.options?.receiptConfirmations ??
                    globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
                timeout:
                    params.options?.receiptTimeout ??
                    globalConfig.TX_MANAGER.DEFAULT_RECEIPT_TIMEOUT,
            });

            submissionBlock = receipt.blockNumber;

            const decodedEvents = [];
            if (receipt.logs && receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    try {
                        const decoded = decodeEventLog({
                            abi: params.abi,
                            data: log.data,
                            topics: log.topics,
                        });
                        decodedEvents.push(decoded);
                    } catch (error) {
                        // Skip logs that can't be decoded with this ABI
                    }
                }
            }

            const managedTx: ManagedTx = {
                id,
                messageId: params.messageId,
                chainName: params.chain.name,
                type,
                params,
                attempts: [],
                retryCount: 0,
                lastChecked: Date.now(),
                decodedEvents: decodedEvents.length > 0 ? decodedEvents : undefined,
            };

            if (txHash && receipt) {
                const attempt: TxAttempt = {
                    txHash,
                    submissionBlock,
                    submittedAt: Date.now(),
                    status: "pending",
                };

                managedTx.attempts.push(attempt);
                this.registerTx(managedTx);

                logger.info(
                    `[TxManager]: Transaction ${txHash} submitted (logical id: ${id}, type: ${type}) for chain ${params.chain.name}`,
                );

                this.txMonitor.addTransaction(attempt.txHash, managedTx);
            }

            return managedTx;
        } catch (error) {
            logger.error(`[TxManager]: Failed to submit transaction`, error);

            return {
                id,
                chainName: params.chain.name,
                type,
                params,
                attempts: [],
                retryCount: 0,
                lastChecked: Date.now(),
            };
        }
    }

    public async getLogs(query: LogQuery, network: ConceroNetwork): Promise<LogResult[]> {
        const contractLogs = this.cachedLogs.get(query.address);
        const eventName = query.event?.name || "";
        if (contractLogs && contractLogs.has(eventName)) {
            let logs = contractLogs.get(eventName) || [];
            // Optionally filter by event.args if provided
            if (query.event?.args) {
                logs = logs.filter(log => {
                    if (!log.decodedLog || !log.decodedLog.args) return false;
                    // Shallow compare args (customize as needed for deep equality)
                    for (const [key, value] of Object.entries(query.event!.args!)) {
                        if (log.decodedLog.args[key] !== value) return false;
                    }
                    return true;
                });
            }
            return logs;
        }

        // If not cached, fetch from chain
        const { publicClient } = this.viemClientManager.getClients(network);

        let logs;
        try {
            logs = await publicClient.getLogs({
                address: query.address,
                fromBlock: query.fromBlock,
                toBlock: query.toBlock,
                ...(query.event ? { events: [query.event] } : {}),
            } as any);
        } catch (error) {
            logger.error(`[TxManager]: Error fetching logs for ${network.name}`, error);
            return [];
        }

        const processedLogs: LogResult[] = logs.map(log => {
            const result: LogResult = {
                address: query.address,
                data: log.data,
                topics: [...log.topics],
                blockNumber: log.blockNumber,
                transactionHash: log.transactionHash,
                logIndex: log.logIndex ?? 0,
                removed: false,
                chainName: network.name,
            };

            if (query.event) {
                try {
                    result.decodedLog = decodeEventLog({
                        abi: [query.event],
                        data: log.data,
                        topics: log.topics as unknown as [`0x${string}`, ...`0x${string}`[]],
                    });
                } catch (error) {
                    logger.debug(`[TxManager]: Error decoding log for ${network.name}`, error);
                }
            }

            return result;
        });

        // Store in cache
        let contractCache = this.cachedLogs.get(query.address);
        if (!contractCache) {
            contractCache = new Map();
            this.cachedLogs.set(query.address, contractCache);
        }
        let eventCache = contractCache.get(eventName);
        if (!eventCache) {
            eventCache = [];
            contractCache.set(eventName, eventCache);
        }
        eventCache.push(...processedLogs);

        // Optionally filter by event.args if provided
        let filteredLogs = processedLogs;
        if (query.event?.args) {
            filteredLogs = processedLogs.filter(log => {
                if (!log.decodedLog || !log.decodedLog.args) return false;
                for (const [key, value] of Object.entries(query.event!.args!)) {
                    if (log.decodedLog.args[key] !== value) return false;
                }
                return true;
            });
        }

        return filteredLogs;
    }

    public override dispose(): void {
        for (const [chain, unwatcher] of this.blockManagerUnwatchers.entries()) {
            unwatcher();
            logger.info(`[TxManager]: Stopped block monitoring for ${chain}`);
        }

        this.blockManagerUnwatchers.clear();
        this.cachedLogs.clear();
        this.logWatchers.clear();
        this.transactions.clear();
        this.txByType.forEach(set => set.clear());
        this.txHashToId.clear();

        if (this.txMonitor) {
            this.txMonitor.dispose();
        }

        super.dispose();
        logger.info("[TxManager]: Disposed");
    }

    public getPendingTransactions(chainName?: string): ManagedTx[] {
        return Array.from(this.transactions.values()).filter(tx => {
            if (chainName && tx.chainName !== chainName) return false;
            return tx.attempts.some(a => a.status === "pending");
        });
    }

    public getTransactionsByMessageId(messageId: string): ManagedTx[] {
        return Array.from(this.transactions.values()).filter(tx => tx.messageId === messageId);
    }
}
