import {
    ContractFunctionExecutionError,
    Hash,
    NonceTooHighError,
    TransactionExecutionError,
    type PublicClient,
    type SimulateContractParameters,
    type WalletClient,
} from "viem";
import { AppErrorEnum } from "../../../constants";
import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";
import { NonceTooLowError } from "viem";
import { NonceManagerSource } from "../managers/NonceManagerSource";

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
) {
    const chainId = publicClient.chain!.id;
    const address = walletClient.account!.address;

    const hash = await walletClient.writeContract({
        ...simulateContractParams,
        nonce: await NonceManagerSource.getInstance().consume({
            address,
            chainId,
            client: publicClient,
        }),
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

                        NonceManagerSource.getInstance().reset({ chainId, address });

                        return true;
                    }
                }
            }

            return false;
        };

        return asyncRetry(
            () => executeTransaction(publicClient, walletClient, simulateContractParams),
            {
                maxRetries: 5,
                delayMs: 1000,
                isRetryableError,
            },
        );
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
