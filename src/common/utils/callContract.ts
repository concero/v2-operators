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
import { globalConfig } from "../../constants";
import { NonceManager } from "../managers";

import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    contractParams: SimulateContractParameters,
) {
    const chainId = publicClient.chain!.id;
    const address = walletClient.account!.address;

    const nonceManager = NonceManager.getInstance();

    let paramsToSend = {
        ...contractParams,
        nonce: await nonceManager.consume({
            address,
            chainId,
            client: publicClient,
        }),
        gas: globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT,
    };

    let txHash: string;

    if (globalConfig.VIEM.SIMULATE_TX) {
        const { request } = await publicClient.simulateContract(contractParams);
        txHash = await walletClient.writeContract(request);
    } else {
        txHash = await walletClient.writeContract(paramsToSend as any);
    }

    return txHash;
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
