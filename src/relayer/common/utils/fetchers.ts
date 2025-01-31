import { globalConfig } from "../../../constants/";
import { httpClient } from "./httpClient";

const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (globalConfig.NETWORK_MODE === "localhost") {
        return [process.env.LOCALHOST_RPC_URL as string];
    }

    const urls = await httpClient.get(`${globalConfig.URLS.CONCERO_RPCS}${chainId}.json`);
    return urls.map((url: string) => `https://${url}`);
};

export { fetchRpcUrls };
