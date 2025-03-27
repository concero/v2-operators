import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";
import { AppErrorEnum, globalConfig } from "../../../constants";
import { AppError } from "./AppError";

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash | undefined> {
    try {
        // const { request } = await publicClient.simulateContract(simulateContractParams);

        const hash = await walletClient.writeContract(
            { ...simulateContractParams, gas: 2_000_000n },
            // request,
            // @dev we use it to avoid simulation. on arbitrum sepolia it fakely says the transaction will fail regardless of the rpc
        );

        console.log("\n\nhash: ", hash);

        // @dev TODO: We need to check the status of the tx
        const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
            // ...globalConfig.VIEM.RECEIPT,
            hash,
        });

        // const transaction = await publicClient.getTransaction(hash);
        return hash;
    } catch (error) {
        console.log("\n\nerror: ", error);
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
