import { Abi, Address, PublicClient, SimulateContractParameters, WalletClient } from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

export interface TxSubmissionParams {
    contractAddress: Address;
    abi: Abi;
    functionName: string;
    args: any[];
    chain: ConceroNetwork;
    messageId?: string;
    options?: {
        maxFeePerGas?: bigint;
        maxPriorityFeePerGas?: bigint;
        gasLimit?: bigint;
        nonce?: number;
        value?: bigint;
        receiptConfirmations?: number;
        receiptTimeout?: number;
        retries?: number;
    };
}

export interface ManagedTx {
    id: string;
    chainName: string;
    messageId?: string;
    txHash: string;
    submittedAt: number;
    submissionBlock: bigint | null;
    status: string;
}

export interface ITxWriter {
    callContract(
        walletClient: WalletClient,
        publicClient: PublicClient,
        params: SimulateContractParameters,
    ): Promise<ManagedTx>;
    getPendingTransactions(chainName?: string): ManagedTx[];
    getTransactionsByMessageId(messageId: string): ManagedTx[];
    onTxReorg(txHash: string, chainName: string): Promise<string | null>;
    onTxFinality(txHash: string, chainName: string): void;
    initialize(): Promise<void>;
    dispose(): void;
}
