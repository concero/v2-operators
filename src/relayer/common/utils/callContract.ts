import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";
import { AppErrorEnum } from "../../../constants";
import { AppError } from "./AppError";

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash | undefined> {
    try {
        // const { request } = await publicClient.simulateContract(simulateContractParams);

        const hash = await walletClient.writeContract(simulateContractParams);

        // @dev TODO: We need to check the status of the tx
        // const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
        //     // ...globalConfig.VIEM.RECEIPT,
        //     hash,
        // });

        // const transaction = await publicClient.getTransaction(hash);
        return hash;
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
