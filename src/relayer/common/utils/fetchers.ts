import { globalConfig, testnetNetworks } from "../../../constants/";
import { httpClient } from "./httpClient";

export const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (globalConfig.NETWORK_MODE === "localhost") {
        return [process.env.LOCALHOST_RPC_URL as string];
    }

    const chainName = Object.values(testnetNetworks).findLast(e => e.id === chainId).name;
    const chainConfig = await httpClient.get(
        `${globalConfig.URLS.CONCERO_RPCS}${chainId}-${chainName}.json`,
    );
    return chainConfig.urls.map((url: string) => `https://${url}`);
};
