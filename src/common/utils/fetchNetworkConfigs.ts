import { globalConfig } from "../../constants";
import { ChainDefinition, createViemChain } from "./createViemChain";
import { HttpClient } from "./HttpClient";
import { Logger } from "./Logger";

export interface NetworkDetail {
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

export async function fetchNetworkConfigs(): Promise<NetworkConfigs> {
    const logger = Logger.getInstance().getLogger("NetworkConfig");
    const httpClient = HttpClient.getInstance(logger, {
        retryDelay: 1000,
        maxRetries: 3,
        defaultTimeout: 5000,
    });

    try {
        const [mainnetData, testnetData] = await Promise.all([
            httpClient.get(globalConfig.URLS.V2_NETWORKS.MAINNET),
            httpClient.get(globalConfig.URLS.V2_NETWORKS.TESTNET),
        ]);

        const mainnetNetworks = processNetworkData(
            mainnetData as Record<string, NetworkDetail>,
            false,
            logger,
        );

        const testnetNetworks = processNetworkData(
            testnetData as Record<string, NetworkDetail>,
            true,
            logger,
        );

        return {
            mainnetNetworks,
            testnetNetworks,
        };
    } catch (error: unknown) {
        logger.error("Failed to fetch network configurations:", error);
        throw error;
    }
}

function processNetworkData(
    networkData: Record<string, NetworkDetail>,
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
