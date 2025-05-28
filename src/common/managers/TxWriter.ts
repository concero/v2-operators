import { PublicClient, SimulateContractParameters, WalletClient } from "viem";

import { v4 as uuidv4 } from "uuid";

import { globalConfig } from "../../constants";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ITxWriter, ManagedTx, TxSubmissionParams } from "../../types/managers/ITxWriter";
import { callContract } from "../utils/callContract";
import { Logger, LoggerInterface } from "../utils/logger";

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
    private logger: LoggerInterface;

    private constructor(networkManager: NetworkManager, viemClientManager: ViemClientManager) {
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.logger = Logger.getInstance().getLogger("TxWriter");
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
        this.logger.info("Initialized");
    }

    public async callContract(
        walletClient: WalletClient,
        publicClient: PublicClient,
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<ManagedTx> {
        const txType = this.determineTxType(params);

        try {
            if (globalConfig.TX_MANAGER.DRY_RUN) {
                this.logger.info(
                    `[DRY_RUN][${network.name}] Contract call: ${params.functionName}`,
                );
                const mockTxHash = `0xdry${Date.now().toString(16)}`;
                const managedTx = this.createManagedTx(network, params, txType, mockTxHash);
                return managedTx;
            }

            const txHash = await callContract(publicClient, walletClient, params);

            this.logger.debug(`[${network.name}] Contract call transaction hash: ${txHash}`);
            const managedTx = this.createManagedTx(network, params, txType, txHash);

            return managedTx;
        } catch (error) {
            this.logger.error(`[${network.name}] Contract call failed: ${error}`);
            throw error;
        }
    }

    private createManagedTx(
        network: ConceroNetwork,
        params: SimulateContractParameters,
        txType: TxType,
        txHash: string,
    ): ManagedTx {
        const id = uuidv4();
        const managedTx: ManagedTx = {
            id,
            chainName: network.name,
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
            this.logger.warn(`[${chainName}] Cannot find transaction ${txHash} for reorg handling`);
            return null;
        }

        this.logger.info(`[${chainName}] Handling reorg for transaction ${txHash}`);

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
            this.logger.warn(
                `[${chainName}] Cannot find transaction ${txHash} for finality handling`,
            );
            return;
        }

        this.logger.info(`[${chainName}] Transaction ${txHash} is now final`);
        tx.status = TxStatus.FINALIZED;
    }

    public getPendingTransactions(chainName?: string): ManagedTx[] {
        const allTxs = Array.from(this.transactions.values());

        return allTxs.filter(tx => {
            if (chainName && tx.chainName !== chainName) return false;
            return tx.status !== TxStatus.FINALIZED;
        });
    }

    public dispose(): void {
        this.transactions.clear();
        this.txByType.clear();
        this.logger.info("Disposed");
    }
}
