import {
    Abi,
    Address,
    PublicClient,
    SimulateContractParameters,
    TransactionReceipt,
    WalletClient,
    createWalletClient,
} from "viem";

import { v4 as uuidv4 } from "uuid";

import { globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxWriter, ManagedTx, TxSubmissionParams } from "../../types/managers/ITxWriter";
import { logger } from "../utils";
import { callContract } from "../utils/callContract";

import { NetworkManager } from "./NetworkManager";
import { ViemClientManager } from "./ViemClientManager";

enum TxType {
    DEFAULT = "default",
    MESSAGE = "message",
    FEE = "fee",
    ADMIN = "admin",
}

enum TxStatus {
    PENDING = "pending",
    SUBMITTED = "submitted",
    CONFIRMED = "confirmed",
    FINALIZED = "finalized",
    FAILED = "failed",
}

export class TxWriter implements ITxWriter {
    private static instance: TxWriter | undefined;
    private transactions: Map<string, ManagedTx> = new Map();
    private txByType: Map<string, Set<string>> = new Map([
        [TxType.DEFAULT, new Set()],
        [TxType.MESSAGE, new Set()],
        [TxType.FEE, new Set()],
        [TxType.ADMIN, new Set()],
    ]);

    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;

    private constructor(networkManager: NetworkManager, viemClientManager: ViemClientManager) {
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
    }

    public static createInstance(
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
    ): TxWriter {
        TxWriter.instance = new TxWriter(networkManager, viemClientManager);
        return TxWriter.instance;
    }

    public static getInstance(): TxWriter {
        if (!TxWriter.instance) {
            throw new Error("TxWriter is not initialized. Call createInstance() first.");
        }
        return TxWriter.instance;
    }

    public async initialize(): Promise<void> {
        logger.info("[TxWriter]: Initialized successfully");
    }

    public async callContract(
        walletClient: WalletClient,
        publicClient: PublicClient,
        params: SimulateContractParameters,
    ): Promise<ManagedTx> {
        const txType = await this.determineTxType(params);

        try {
            if (globalConfig.TX_MANAGER.DRY_RUN) {
                logger.info(
                    `[DRY_RUN][${params.chain.name}] Contract call: ${params.functionName}`,
                );
                const mockTxHash = `0xdry${Date.now().toString(16)}`;
                const managedTx = this.createManagedTx(params, txType, mockTxHash);
                return managedTx;
            }

            const txHash = await callContract(publicClient, walletClient, params);

            logger.info(`[${params.chain.name}] Contract call transaction hash: ${txHash}`);
            const managedTx = this.createManagedTx(params, txType, txHash);

            return managedTx;
        } catch (error) {
            logger.error(`[${params.chain.name}] Contract call failed: ${error}`);
            throw error;
        }
    }

    private createManagedTx(
        params: SimulateContractParameters,
        txType: TxType,
        txHash: string,
    ): ManagedTx {
        const id = uuidv4();
        const managedTx: ManagedTx = {
            id,
            chainName: params.chain.name,
            messageId: (params as any).messageId, // Access messageId if available
            txHash,
            submittedAt: Date.now(),
            submissionBlock: null,
            status: TxStatus.SUBMITTED,
        };

        this.transactions.set(id, managedTx);
        this.txByType.get(txType)?.add(id);

        return managedTx;
    }

    private updateTxStatus(managedTx: ManagedTx, status: string, blockNumber?: bigint): void {
        managedTx.status = status;
        if (blockNumber) {
            managedTx.submissionBlock = blockNumber;
        }
    }

    private async determineTxType(params: TxSubmissionParams): Promise<TxType> {
        if (params.messageId) {
            return TxType.MESSAGE;
        }

        // Here you could implement more sophisticated logic to determine the tx type
        // based on contract addresses, function names, etc.
        return TxType.DEFAULT;
    }

    private findTransactionByHash(txHash: string): ManagedTx | null {
        for (const tx of this.transactions.values()) {
            if (tx.txHash === txHash) {
                return tx;
            }
        }
        return null;
    }

    public async onTxReorg(txHash: string, chainName: string): Promise<string | null> {
        const tx = this.findTransactionByHash(txHash);
        if (!tx) {
            logger.warn(
                `[TxWriter][${chainName}] Cannot find transaction ${txHash} for reorg handling`,
            );
            return null;
        }

        logger.info(`[TxWriter][${chainName}] Handling reorg for transaction ${txHash}`);

        // Here you would implement the logic to resend the transaction
        // This is a simplified version
        tx.status = TxStatus.FAILED;

        // In a real implementation, you would need to extract the original tx params
        // and call writeContract again
        return null;
    }

    public onTxFinality(txHash: string, chainName: string): void {
        const tx = this.findTransactionByHash(txHash);
        if (!tx) {
            logger.warn(
                `[TxWriter][${chainName}] Cannot find transaction ${txHash} for finality handling`,
            );
            return;
        }

        logger.info(`[TxWriter][${chainName}] Transaction ${txHash} is now final`);
        tx.status = TxStatus.FINALIZED;
    }

    public getPendingTransactions(chainName?: string): ManagedTx[] {
        const allTxs = Array.from(this.transactions.values());

        return allTxs.filter(tx => {
            if (chainName && tx.chainName !== chainName) return false;
            return tx.status !== TxStatus.FINALIZED;
        });
    }

    public getTransactionsByMessageId(messageId: string): ManagedTx[] {
        return Array.from(this.transactions.values()).filter(tx => tx.messageId === messageId);
    }

    public dispose(): void {
        this.transactions.clear();
        this.txByType.clear();
        logger.info("[TxWriter]: Disposed");
    }
}
