import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";

import { NonceManager } from "@concero/operator-utils";
import { AppErrorEnum, globalConfig } from "../../constants";

import confirmations from "../../constants/confirmations.json";
import { IConfirmations } from "../../types/Confirmations";
import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";
import { isNonceError, isWaitingForReceiptError } from "./viemErrorParser";

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
        confirmations: (confirmations as IConfirmations)[chainId.toString()] ?? undefined,
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
            if (isNonceError(error) || isWaitingForReceiptError(error)) {
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
