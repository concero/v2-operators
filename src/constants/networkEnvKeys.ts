import { ConceroNetworkNames } from "../types/ConceroNetwork";

export const networkEnvKeys: Record<ConceroNetworkNames, string> = {
    // mainnets
    ethereum: "ETHEREUM",
    arbitrum: "ARBITRUM",
    optimism: "OPTIMISM",
    polygon: "POLYGON",
    polygonZkEvm: "POLYGON_ZKEVM",
    avalanche: "AVALANCHE",
    base: "BASE",
    // testnets
    sepolia: "ETHEREUM_SEPOLIA",
    optimismSepolia: "OPTIMISM_SEPOLIA",
    arbitrumSepolia: "ARBITRUM_SEPOLIA",
    avalancheFuji: "AVALANCHE_FUJI",
    baseSepolia: "BASE_SEPOLIA",
    polygonAmoy: "POLYGON_AMOY",
    localhost: "LOCALHOST",
};
