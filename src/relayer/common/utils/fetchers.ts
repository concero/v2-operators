import { config } from "../../../constants/config";
import { urls } from "../../../constants/urls";

const fetchRpcUrls = async (chainId: number): Promise<string[]> => {
    if (config.NETWORK_MODE === "localhost") return ["127.0.0.1:8545"];
    const response = await fetch(`${urls.CONCERO_RPCS_DIR}${chainId}.json`);
    if (!response.ok) {
        throw new Error(`Failed to fetch RPC URLs for chainId ${chainId}`);
    }
    return response.json();
};

export { fetchRpcUrls };
