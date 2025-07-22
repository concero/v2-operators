import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";

import { NonceManager } from "@concero/operator-utils";
import { AppErrorEnum } from "../../constants";

import confirmations from "../../constants/confirmations.json";
import { IConfirmations } from "../../types/Confirmations";
import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";
import { isNonceError, isWaitingForReceiptError } from "./viemErrorParser";

export interface CallContractConfig {
    simulateTx: boolean;
    defaultGasLimit?: bigint;
}

async function executeTransaction(
    publicClient: PublicClient,
    walletClient: WalletClient,
    params: SimulateContractParameters,
    nonceManager: NonceManager,
    config: CallContractConfig,
) {
    const chainId = publicClient.chain!.id;
    const address = walletClient.account!.address;

    let txHash: string;
    if (config.simulateTx) {
        const { request } = await publicClient.simulateContract(params);
        txHash = await walletClient.writeContract({ request } as any);
    } else {
        const nonce = await nonceManager.consume({
            address,
            chainId,
            client: publicClient,
        });

        const paramsToSend = {
            ...(config.defaultGasLimit && { gas: config.defaultGasLimit }),
            ...params,
            nonce,
        };

        txHash = await walletClient.writeContract(paramsToSend as any);
    }

    await publicClient.waitForTransactionReceipt({
        hash: txHash as Hash,
        confirmations: (confirmations as IConfirmations)[chainId.toString()] ?? undefined,
    });

    return txHash as Hash;
}

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    params: SimulateContractParameters,
    nonceManager: NonceManager,
    config: CallContractConfig,
): Promise<Hash> {
    try {
        const isRetryableError = async (error: any) => {
            if (isNonceError(error) || isWaitingForReceiptError(error)) {
                const chainId = publicClient.chain!.id;
                const address = walletClient.account!.address;

                nonceManager.reset({ chainId, address });

                return true;
            }

            return false;
        };

        return asyncRetry<Hash>(
            () => executeTransaction(publicClient, walletClient, params, nonceManager, config),
            {
                maxRetries: 20,
                delayMs: 1000,
                isRetryableError,
            },
        );
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error as Error);
    }
}
