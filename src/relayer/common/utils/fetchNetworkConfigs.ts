import { globalConfig } from "../../../constants";
import { ChainDefinition, createViemChain } from "./createViemChain";
import { httpQueue } from "./httpClient";

interface NetworkDetail {
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

export async function fetchNetworkConfigs() {
    try {
        const [mainnetSummary, testnetSummary] = await Promise.all([
            httpQueue.get(globalConfig.URLS.V2_NETWORKS.MAINNET_SUMMARY),
            httpQueue.get(globalConfig.URLS.V2_NETWORKS.TESTNET_SUMMARY),
        ]);

        const mainnetDetailPromises = Object.keys(mainnetSummary).map(async networkName => {
            const url = `${globalConfig.URLS.V2_NETWORKS.MAINNET_DETAIL_BASE}/${networkName}.json`;
            const response = await httpQueue.get(url);
            const details: NetworkDetail = await response;
            return { networkName, details };
        });

        const testnetDetailPromises = Object.keys(testnetSummary).map(async networkName => {
            const url = `${globalConfig.URLS.V2_NETWORKS.TESTNET_DETAIL_BASE}/${networkName}.json`;
            const response = await httpQueue.get(url);
            const details: NetworkDetail = await response;
            return { networkName, details };
        });

        const mainnetDetails = await Promise.all(mainnetDetailPromises);
        const testnetDetails = await Promise.all(testnetDetailPromises);

        const processedMainnetNetworks = mainnetDetails.reduce((acc, { networkName, details }) => {
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
                isTestnet: false,
            };

            acc[networkName] = {
                name: details.name,
                chainId: details.chainId,
                chainSelector: details.chainSelector.toString(),
                viemChain: createViemChain(chainDefinition),
            };
            return acc;
        }, {});

        const processedTestnetNetworks = testnetDetails.reduce((acc, { networkName, details }) => {
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
                isTestnet: true,
            };

            acc[networkName] = {
                name: details.name,
                chainId: details.chainId,
                chainSelector: details.chainSelector.toString(),
                viemChain: createViemChain(chainDefinition),
            };
            return acc;
        }, {});

        return {
            mainnetNetworks: processedMainnetNetworks,
            testnetNetworks: processedTestnetNetworks,
        };
    } catch (error) {
        console.error("Failed to fetch network configurations:", error);
        return { mainnetNetworks: {}, testnetNetworks: {} };
    }
}
