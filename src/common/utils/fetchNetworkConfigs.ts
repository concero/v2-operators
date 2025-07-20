import { ChainDefinition, createViemChain } from "./createViemChain";
import { HttpClient } from "./HttpClient";
import { Logger } from "./Logger";

export interface V2Network {
    name: string;
    chainId: number;
    chainSelector: number;
    rpcUrls: string[];
    blockExplorers: {
        name: string;
        url: string;
        apiUrl: string;
    }[];
    faucets?: string[];
    nativeCurrency?: {
        name: string;
        symbol: string;
        decimals: number;
    };
}

export interface ProcessedNetwork {
    name: string;
    chainId: number;
    chainSelector: string;
    viemChain: ReturnType<typeof createViemChain>;
}

export interface NetworkConfigs {
    mainnetNetworks: Record<string, ProcessedNetwork>;
    testnetNetworks: Record<string, ProcessedNetwork>;
}

export async function fetchNetworkConfigs(
    networkMode: "mainnet" | "testnet" | "localhost" = "testnet",
    urls?: { mainnet: string; testnet: string },
): Promise<NetworkConfigs> {
    const logger = Logger.getInstance().getLogger("NetworkConfig");
    const httpClient = HttpClient.getInstance();

    try {
        let mainnetNetworks: Record<string, ProcessedNetwork> = {};
        let testnetNetworks: Record<string, ProcessedNetwork> = {};

        if (networkMode === "localhost") {
            // For localhost mode, return empty networks as they are handled separately
            return { mainnetNetworks, testnetNetworks };
        }

        if (networkMode === "mainnet") {
            if (!urls?.mainnet) throw new Error("Mainnet URL is required");
            const mainnetData = await httpClient.get(urls.mainnet);
            mainnetNetworks = processNetworkData(
                mainnetData as Record<string, V2Network>,
                false,
                logger,
            );
        } else if (networkMode === "testnet") {
            if (!urls?.testnet) throw new Error("Testnet URL is required");
            const testnetData = await httpClient.get(urls.testnet);
            testnetNetworks = processNetworkData(
                testnetData as Record<string, V2Network>,
                true,
                logger,
            );
        }

        return {
            mainnetNetworks,
            testnetNetworks,
        };
    } catch (error: unknown) {
        logger.error(`Failed to fetch ${networkMode} network configurations:`, error);
        throw error;
    }
}

function processNetworkData(
    networkData: Record<string, V2Network>,
    isTestnet: boolean,
    logger: ReturnType<typeof Logger.prototype.getLogger>,
): Record<string, ProcessedNetwork> {
    const processedNetworks: Record<string, ProcessedNetwork> = {};

    for (const [networkName, details] of Object.entries(networkData)) {
        try {
            const chainDefinition: ChainDefinition = {
                id: details.chainId,
                name: details.name,
                rpcUrls: details.rpcUrls,
                blockExplorer: details.blockExplorers[0]
                    ? {
                          name: details.blockExplorers[0].name,
                          url: details.blockExplorers[0].url,
                      }
                    : undefined,
                isTestnet,
            };

            processedNetworks[networkName] = {
                name: details.name,
                chainId: details.chainId,
                chainSelector: details.chainSelector.toString(),
                viemChain: createViemChain(chainDefinition),
            };
        } catch (error: unknown) {
            const networkType = isTestnet ? "testnet" : "mainnet";
            logger.warn(
                `Failed to process ${networkType} network ${networkName}: ${error instanceof Error ? error.message : String(error)}`,
            );
        }
    }

    return processedNetworks;
}
