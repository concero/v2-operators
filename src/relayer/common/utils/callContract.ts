import { Hash } from "viem";
import { globalConfig } from "../../../constants";
import { ICallContract } from "../../../types/ICallContract";
import { getFallbackClients } from "./getViemClients";

export async function callContract({
    chain,
    address,
    abi,
    functionName,
    args,
    options = {},
}: ICallContract): Promise<Hash | undefined> {
    try {
        const { publicClient, walletClient, account } = await getFallbackClients(chain);

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
            ...globalConfig.VIEM.RECEIPT,
            hash,
        });

        return hash;
    } catch (error) {
        console.error("Error executing contract call:", error);
    }
}
