import { config } from "../../../constants/config";
import httpClient from "./httpClient";

const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (config.NETWORK_MODE === "localhost") {
        return [process.env.LOCALHOST_RPC_URL as string];
    }

    try {
        const urls = await httpClient.get(`${config.URLS.CONCERO_RPCS}${chainId}.json`);
        return urls.map((url: string) => `https://${url}`);
    } catch (error) {
        throw new AppError(`Failed to fetch RPC URLs for chainId ${chainId}`, 500, true);
    }
};

export { fetchRpcUrls };
