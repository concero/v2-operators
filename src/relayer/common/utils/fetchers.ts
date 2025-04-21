import { globalConfig } from "../../../constants/";
import { getChainNameById } from "./getChainNameById";
import { httpClient } from "./httpClient";

export const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (globalConfig.NETWORK_MODE === "localhost") {
        return [process.env.LOCALHOST_RPC_URL as string];
    }

    const chainName = await getChainNameById(chainId);
    const chainConfig = await httpClient.get(
        `${globalConfig.URLS.CONCERO_RPCS}${globalConfig.NETWORK_MODE}/${chainId}-${chainName}.json`,
    );
    return chainConfig.urls.map((url: string) => `https://${url}`);
};
