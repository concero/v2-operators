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
import { NonceManagerSource } from "../managers/NonceManagerSource";
import { nonceManager } from "../managers/nonceManager";
import { NonceTooLowError } from "viem";

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
) {
    // const { request } = await publicClient.simulateContract(simulateContractParams);
    // const hash = await walletClient.writeContract(request);

    const hash = await walletClient.writeContract({
        ...simulateContractParams,
        // nonce: await nonceManager.consume({
        //     chainId: publicClient.chain?.id,
        //     address: walletClient.account?.address,
        //     client: walletClient,
        // }),
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
        const isRetryableError = (error: any) => {
            if (error instanceof ContractFunctionExecutionError) {
                if (error.cause instanceof TransactionExecutionError) {
                    if (
                        error.cause.cause instanceof NonceTooHighError ||
                        error.cause.cause instanceof NonceTooLowError
                    ) {
                        const chainId = publicClient.chain!.id;
                        const address = walletClient.account!.address;

                        nonceManager.reset({ chainId, address });
                        NonceManagerSource.getInstance().set({ chainId, address }, 0);

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
                isRetryableError,
            },
        );
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
