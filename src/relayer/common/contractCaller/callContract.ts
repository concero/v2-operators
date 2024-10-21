import { getFallbackClients } from "../../../utils/getViemClients";
import { viemReceiptConfig } from "../../../constants/config";
import { ICallContract } from "../../../types/ICallContract";
import { Hash } from "viem";

export async function callContract({
    chain,
    address,
    abi,
    functionName,
    args,
    options = {},
}: ICallContract): Promise<Hash | undefined> {
    try {
        const { publicClient, walletClient, account } = getFallbackClients(chain);

        const { request } = await publicClient.simulateContract({
            account,
            chain: chain.viemChain,
            address,
            abi,
            functionName,
            args,
            options,
        });

        const hash = await walletClient.writeContract(request);

        const { cumulativeGasUsed } = await publicClient.waitForTransactionReceipt({
            ...viemReceiptConfig,
            hash,
        });

        return hash;
    } catch (error) {
        console.error("Error executing contract call:", error);
    }
}
