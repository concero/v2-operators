import { Hash, type PublicClient, type SimulateContractParameters, type WalletClient } from "viem";
import { AppErrorEnum } from "../../../constants";
import { AppError } from "./AppError";
import { nonceManager } from "../managers/NonceManager";

export async function callContract(
    publicClient: PublicClient,
    walletClient: WalletClient,
    simulateContractParams: SimulateContractParameters,
): Promise<Hash | undefined> {
    try {
        // const { request } = await publicClient.simulateContract(simulateContractParams);

        const hash = await walletClient.writeContract(
            {
                ...simulateContractParams,
                gas: 2_000_000n,
                nonce: await nonceManager.consume({
                    chainId: publicClient.chain?.id,
                    client: publicClient,
                    address: walletClient.account?.address,
                }),
            },
            // request,
            // @dev we use it to avoid simulation. on arbitrum sepolia it fakely says the transaction will fail regardless of the rpc
        );

        // @dev TODO: We need to check the status of the tx
        const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
            // ...globalConfig.VIEM.RECEIPT,
            hash,
        });

        // const transaction = await publicClient.getTransaction(hash);
        return hash;
    } catch (error) {
        throw new AppError(AppErrorEnum.ContractCallError, error);
    }
}
