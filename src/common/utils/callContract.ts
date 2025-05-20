import {
    ContractFunctionExecutionError,
    Hash,
    NonceTooHighError,
    type PublicClient,
    type SimulateContractParameters,
    TransactionExecutionError,
    type WalletClient,
} from "viem";
import { NonceTooLowError } from "viem";

import { AppErrorEnum } from "../../constants";
import { NonceManager } from "../managers";

import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
) {
    const chainId = publicClient.chain!.id;
    const address = walletClient.account!.address;

    const nonceManager = NonceManager.getInstance();
    const hash = await walletClient.writeContract({
        ...simulateContractParams,
        nonce: await nonceManager.consume({
            address,
            chainId,
            client: publicClient,
        }),
        gas: 2_000_000n,
    });

    // @dev TODO: We need to check the status of the tx
    // await publicClient.waitForTransactionReceipt({ hash });

    return hash;
}

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash> {
    try {
        const isRetryableError = async (error: any) => {
            if (error instanceof ContractFunctionExecutionError) {
                if (error.cause instanceof TransactionExecutionError) {
                    if (
                        error.cause.cause instanceof NonceTooHighError ||
                        error.cause.cause instanceof NonceTooLowError
                    ) {
                        const chainId = publicClient.chain!.id;
                        const address = walletClient.account!.address;

                        NonceManager.getInstance().reset({ chainId, address });

                        return true;
                    }
                }
            }

            return false;
        };

        return asyncRetry(
            () => executeTransaction(publicClient, walletClient, simulateContractParams),
            {
                maxRetries: 100,
                delayMs: 1000,
                isRetryableError,
            },
        );
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
