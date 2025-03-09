import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";
import { AppErrorEnum, globalConfig } from "../../../constants";
import { AppError } from "./AppError";
import { prepareTransactionRequest } from "viem/actions/wallet/prepareTransactionRequest";

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash | undefined> {
    try {
        // const { request } = await publicClient.simulateContract({
        //     ...simulateContractParams,
        //     gas: 1_000_000n,
        // });

        const hash = await walletClient.writeContract({
            ...simulateContractParams,
            // @dev we use it to avoid simulation. on arbitrum sepolia it fakely says the transaction will fail regardless of the rpc
            gas: 1_000_000n,
        });

        // @dev TODO: We need to check the status of the tx
        const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
            ...globalConfig.VIEM.RECEIPT,
            hash,
        });

        // const transaction = await publicClient.getTransaction(hash);
        return hash;
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
