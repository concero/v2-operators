import { globalConfig } from "../../../constants/";
import { httpClient } from "./httpClient";

export const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (globalConfig.NETWORK_MODE === "localhost") {
        return [process.env.LOCALHOST_RPC_URL as string];
    }

    const chainConfig = await httpClient.get(`${globalConfig.URLS.CONCERO_RPCS}${chainId}.json`);
    return chainConfig.urls.map((url: string) => `https://${url}`);
};
