import {
    Hash,
    NonceTooHighError,
    type PublicClient,
    type SimulateContractParameters,
    type WalletClient,
} from "viem";
import { AppErrorEnum } from "../../../constants";
import { AppError } from "./AppError";
import { nonceManager } from "../managers/nonceManager";
import { TransactionReceipt } from "viem";
import { BaseError } from "viem";
import { NonceTooLowError } from "viem";

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
    options?: {
        skipSimulation?: boolean;
        receiptTimeout?: number;
        receiptConfirmations?: number;
    },
): Promise<TransactionReceipt> {
    try {
        let transactionRequest;

        if (!options?.skipSimulation) {
            const { request } = await publicClient.simulateContract(simulateContractParams);
            transactionRequest = request;
        } else {
            transactionRequest = simulateContractParams;
        }

        const nonce = await nonceManager.consume({
            chainId: publicClient.chain?.id,
            client: publicClient,
            address: walletClient.account?.address,
        });

        const hash = await walletClient.writeContract({
            ...transactionRequest,
            gas: 1_000_000n,
            nonce,
        });

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            confirmations: options?.receiptConfirmations ?? 3,
            timeout: options?.receiptTimeout ?? 60_000, // Default 60 seconds
        });

        return receipt;
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
