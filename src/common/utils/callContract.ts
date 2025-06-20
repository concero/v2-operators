import {
    ContractFunctionExecutionError,
    Hash,
    NonceTooHighError,
    NonceTooLowError,
    type PublicClient,
    type SimulateContractParameters,
    TransactionExecutionError,
    TransactionNotFoundError,
    WaitForTransactionReceiptTimeoutError,
    type WalletClient,
} from "viem";

import { AppErrorEnum, globalConfig } from "../../constants";
import { NonceManager } from "../managers";

import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    params: SimulateContractParameters,
    nonceManager: NonceManager,
) {
    const chainId = publicClient.chain!.id;
    const address = walletClient.account!.address;

    let txHash: string;
    if (globalConfig.VIEM.SIMULATE_TX) {
        const { request } = await publicClient.simulateContract(params);
        txHash = await walletClient.writeContract({ request } as any);
    } else {
        const nonce = await nonceManager.consume({
            address,
            chainId,
            client: publicClient,
        });

        const paramsToSend = {
            gas: globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT,
            ...params,
            nonce,
        };

        txHash = await walletClient.writeContract(paramsToSend as any);
    }

    await publicClient.waitForTransactionReceipt({
        hash: txHash as Hash,
    });

    return txHash as Hash;
}

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    params: SimulateContractParameters,
): Promise<Hash> {
    try {
        const nonceManager = NonceManager.getInstance();

        const isRetryableError = async (error: any) => {
            if (
                (error instanceof ContractFunctionExecutionError &&
                    error.cause instanceof TransactionExecutionError &&
                    (error.cause.cause instanceof NonceTooHighError ||
                        error.cause.cause instanceof NonceTooLowError)) ||
                error instanceof TransactionNotFoundError ||
                error instanceof WaitForTransactionReceiptTimeoutError
            ) {
                const chainId = publicClient.chain!.id;
                const address = walletClient.account!.address;

                nonceManager.reset({ chainId, address });

                return true;
            }

            return false;
        };

        return asyncRetry<Hash>(
            () => executeTransaction(publicClient, walletClient, params, nonceManager),
            {
                maxRetries: 20,
                delayMs: 1000,
                isRetryableError,
            },
        );
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
