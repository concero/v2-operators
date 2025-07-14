import { globalConfig } from "../../constants";
import { ChainDefinition, createViemChain } from "./createViemChain";
import { HttpClient } from "./HttpClient";
import { Logger } from "./Logger";

export interface NetworkDetail {
    name: string;
    chainId: number;
    chainSelector: number;
    rpcs: string[];
    blockExplorers: {
        name: string;
        url: string;
        apiUrl: string;
    }[];
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
    const httpClient = HttpClient.getQueueInstance();
    const logger = Logger.getInstance().getLogger("NetworkConfig");

    try {
        const [mainnetSummary, testnetSummary] = await Promise.all([
            httpClient.get(globalConfig.URLS.V2_NETWORKS.MAINNET_SUMMARY),
            httpClient.get(globalConfig.URLS.V2_NETWORKS.TESTNET_SUMMARY),
        ]);

        const mainnetNetworks = await fetchNetworkDetails(
            mainnetSummary as Record<string, unknown>,
            globalConfig.URLS.V2_NETWORKS.MAINNET_DETAIL_BASE,
            false,
            logger,
        );

        const testnetNetworks = await fetchNetworkDetails(
            testnetSummary as Record<string, unknown>,
            globalConfig.URLS.V2_NETWORKS.TESTNET_DETAIL_BASE,
            true,
            logger,
        );

        return {
            mainnetNetworks,
            testnetNetworks,
        };
    } catch (error: unknown) {
        logger.error("Failed to fetch network summaries:", error);
        throw error;
    }
}

async function fetchNetworkDetails(
    networkSummary: Record<string, unknown>,
    detailBaseUrl: string,
    isTestnet: boolean,
    logger: ReturnType<typeof Logger.prototype.getLogger>,
): Promise<Record<string, ProcessedNetwork>> {
    const httpClient = HttpClient.getQueueInstance();
    const networkNames = Object.keys(networkSummary);

    const detailPromises = networkNames.map(async networkName => {
        try {
            const url = `${detailBaseUrl}/${networkName}.json`;
            const response = await httpClient.get(url);
            const details = response as NetworkDetail;
            return { networkName, details, success: true as const };
        } catch (error: unknown) {
            const networkType = isTestnet ? "testnet" : "mainnet";
            logger.warn(
                `Failed to fetch ${networkType} network details for ${networkName}: ${error instanceof Error ? error.message : String(error)}`,
            );
            return { networkName, success: false as const };
        }
    });

    const detailsResults = await Promise.all(detailPromises);

    const successfulResults = detailsResults.filter(
        (result): result is { networkName: string; details: NetworkDetail; success: true } =>
            result.success,
    );

    return processNetworkDetails(successfulResults, isTestnet);
}

function processNetworkDetails(
    networkDetails: Array<{ networkName: string; details: NetworkDetail; success: true }>,
    isTestnet: boolean,
): Record<string, ProcessedNetwork> {
    return networkDetails.reduce(
        (acc: Record<string, ProcessedNetwork>, { networkName, details }) => {
            const chainDefinition: ChainDefinition = {
                id: details.chainId,
                name: details.name,
                rpcUrls: details.rpcs,
                blockExplorer: details.blockExplorers[0]
                    ? {
                          name: details.blockExplorers[0].name,
                          url: details.blockExplorers[0].url,
                      }
                    : undefined,
                isTestnet,
            };

            acc[networkName] = {
                name: details.name,
                chainId: details.chainId,
                chainSelector: details.chainSelector.toString(),
                viemChain: createViemChain(chainDefinition),
            };
            return acc;
        },
        {},
    );
}
