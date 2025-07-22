import { v4 as uuidv4 } from "uuid";
import { SimulateContractParameters } from "viem";

import { LoggerInterface, NonceManager } from "@concero/operator-utils";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { TxWriterConfig } from "../../types/ManagerConfigs";
import { ITxMonitor, IViemClientManager } from "../../types/managers";
import { ITxWriter } from "../../types/managers/ITxWriter";
import { callContract } from "../utils";

export class TxWriter implements ITxWriter {
    private static instance: TxWriter | undefined;
    private viemClientManager: IViemClientManager;
    private txMonitor: ITxMonitor;
    private logger: LoggerInterface;
    private config: TxWriterConfig;
    private nonceManager: NonceManager;

    private constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txMonitor: ITxMonitor,
        nonceManager: NonceManager,
        config: TxWriterConfig,
    ) {
        this.viemClientManager = viemClientManager;
        this.txMonitor = txMonitor;
        this.logger = logger;
        this.config = config;
        this.nonceManager = nonceManager;
    }

    public static createInstance(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txMonitor: ITxMonitor,
        nonceManager: NonceManager,
        config: TxWriterConfig,
    ): TxWriter {
        TxWriter.instance = new TxWriter(
            logger,
            viemClientManager,
            txMonitor,
            nonceManager,
            config,
        );
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
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<string> {
        try {
            const { walletClient, publicClient } = this.viemClientManager.getClients(network);

            if (this.config.dryRun) {
                this.logger.info(
                    `[DRY_RUN][${network.name}] Contract call: ${params.functionName}`,
                );
                const mockTxHash = `0xdry${Date.now().toString(16)}`;
                return mockTxHash;
            }

            const txHash = await callContract(
                publicClient,
                walletClient,
                params,
                this.nonceManager,
                {
                    simulateTx: this.config.simulateTx,
                    defaultGasLimit: this.config.defaultGasLimit,
                },
            );
            this.logger.debug(`[${network.name}] Contract call transaction hash: ${txHash}`);

            // Get the current block number for tracking
            const currentBlock = await publicClient.getBlockNumber();

            // Create transaction info for monitoring
            const txInfo = {
                id: uuidv4(),
                txHash,
                chainName: network.name,
                submittedAt: Date.now(),
                submissionBlock: currentBlock,
                status: "submitted",
                metadata: {
                    functionName: params.functionName,
                    contractAddress: params.address,
                },
            };

            // Watch this transaction for finality
            this.txMonitor.watchTxFinality(
                txInfo,
                this.createRetryCallback(network, params),
                this.createFinalityCallback(network),
            );

            return txHash;
        } catch (error) {
            this.logger.error(`[${network.name}] Contract call failed:`, error);
            throw error;
        }
    }

    private createRetryCallback(
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): (failedTx: any) => Promise<any | null> {
        return async (failedTx: any): Promise<any | null> => {
            this.logger.info(
                `[${network.name}] Retrying transaction ${failedTx.txHash} (${failedTx.id})`,
            );

            try {
                const { walletClient, publicClient } = this.viemClientManager.getClients(network);

                // Retry the transaction
                const newTxHash = await callContract(
                    publicClient,
                    walletClient,
                    params,
                    this.nonceManager,
                    {
                        simulateTx: this.config.simulateTx,
                        defaultGasLimit: this.config.defaultGasLimit,
                    },
                );
                this.logger.info(`[${network.name}] Retry successful. New tx hash: ${newTxHash}`);

                // Get the current block number for tracking
                const currentBlock = await publicClient.getBlockNumber();

                // Return new transaction info
                return {
                    id: uuidv4(),
                    txHash: newTxHash,
                    chainName: network.name,
                    submittedAt: Date.now(),
                    submissionBlock: currentBlock,
                    status: "submitted",
                    metadata: {
                        functionName: params.functionName,
                        contractAddress: params.address,
                    },
                };
            } catch (error) {
                this.logger.error(
                    `[${network.name}] Failed to retry transaction ${failedTx.txHash}:`,
                    error,
                );
                return null;
            }
        };
    }

    private createFinalityCallback(network: ConceroNetwork): (finalizedTx: any) => void {
        return (finalizedTx: any): void => {
            this.logger.info(
                `[${network.name}] Transaction ${finalizedTx.txHash} (${finalizedTx.id}) is now final`,
            );
        };
    }

    public dispose(): void {
        this.logger.info("Disposed");
    }
}
