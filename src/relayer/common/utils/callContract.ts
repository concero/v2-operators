import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";
import { globalConfig } from "../../../constants";
export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash | undefined> {
    try {
        const { request } = await publicClient.simulateContract(simulateContractParams);

        const hash = await walletClient.writeContract(request);

        const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
            ...globalConfig.VIEM.RECEIPT,
            hash,
        });

        const transaction = await publicClient.getTransaction(hash);

        return hash;
    } catch (error) {
        console.error("Error executing contract call:", error);
    }
}
