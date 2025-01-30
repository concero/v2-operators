import {
    ConceroMainnetNetworkNames,
    type ConceroNetwork,
    ConceroNetworkNames,
    ConceroTestnetNetworkNames,
    NetworkType,
} from "../types/ConceroNetwork";
import {
    arbitrum,
    arbitrumSepolia,
    avalanche,
    avalancheFuji,
    base,
    baseSepolia,
    mainnet,
    optimism,
    optimismSepolia,
    polygon,
    polygonAmoy,
    sepolia,
} from "viem/chains";
import { rpcUrls } from "./rpcUrls";
import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { localhostViemChain } from "../relayer/common/utils/localhostViemChain";

const DEFAULT_BLOCK_CONFIRMATIONS = 2;
const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

export const networkTypes: Record<NetworkType, NetworkType> = {
    mainnet: "mainnet",
    testnet: "testnet",
};

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
    sepolia: "SEPOLIA",
    optimismSepolia: "OPTIMISM_SEPOLIA",
    arbitrumSepolia: "ARBITRUM_SEPOLIA",
    avalancheFuji: "FUJI",
    baseSepolia: "BASE_SEPOLIA",
    polygonAmoy: "POLYGON_AMOY",
    localhost: "LOCALHOST",
};

export const testingNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    localhost: {
        name: "localhost",
        type: networkTypes.testnet,
        id: 1337,
        accounts: [operatorPK],
        chainSelector: "1337",
        confirmations: 1,
        viemChain: localhostViemChain,
    },
};

export const testnetNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    sepolia: {
        name: "sepolia",
        type: networkTypes.testnet,
        id: 11155111,
        rpcUrls: rpcUrls.sepolia,
        accounts: [operatorPK],
        chainSelector: "11155111",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: sepolia,
    },
    avalancheFuji: {
        name: "avalancheFuji",
        type: networkTypes.testnet,
        id: 43113,
        rpcUrls: rpcUrls.avalancheFuji,
        accounts: [operatorPK],
        chainSelector: "43113",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalancheFuji,
    },
    optimismSepolia: {
        name: "optimismSepolia",
        type: networkTypes.testnet,
        id: 11155420,
        rpcUrls: rpcUrls.optimismSepolia,
        accounts: [operatorPK],
        chainSelector: "11155420",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimismSepolia,
    },
    arbitrumSepolia: {
        name: "arbitrumSepolia",
        type: networkTypes.testnet,
        id: 421614,
        rpcUrls: rpcUrls.arbitrumSepolia,
        accounts: [operatorPK],
        chainSelector: "421614",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrumSepolia,
    },
    baseSepolia: {
        name: "baseSepolia",
        type: networkTypes.testnet,
        id: 84532,
        rpcUrls: rpcUrls.baseSepolia,
        accounts: [operatorPK],
        chainSelector: "84532",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: baseSepolia,
    },
    polygonAmoy: {
        name: "polygonAmoy",
        type: networkTypes.testnet,
        id: 80002,
        rpcUrls: rpcUrls.polygonAmoy,
        accounts: [operatorPK],
        chainSelector: "80002",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygonAmoy,
    },
};
export const mainnetNetworks: Record<ConceroMainnetNetworkNames, ConceroNetwork> = {
    ethereum: {
        name: "ethereum",
        type: networkTypes.mainnet,
        id: 1,
        rpcUrls: rpcUrls.ethereum,
        accounts: [operatorPK],
        chainSelector: "1",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: mainnet,
    },
    base: {
        name: "base",
        type: networkTypes.mainnet,
        id: 8453,
        rpcUrls: rpcUrls.base,
        accounts: [operatorPK],
        chainSelector: "8453",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: base,
    },
    arbitrum: {
        name: "arbitrum",
        type: networkTypes.mainnet,
        id: 42161,
        rpcUrls: rpcUrls.arbitrum,
        accounts: [operatorPK],
        chainSelector: "42161",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrum,
    },
    polygon: {
        name: "polygon",
        type: networkTypes.mainnet,
        id: 137,
        rpcUrls: rpcUrls.polygon,
        accounts: [operatorPK],
        chainSelector: "137",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon,
    },
    avalanche: {
        name: "avalanche",
        type: networkTypes.mainnet,
        id: 43114,
        rpcUrls: rpcUrls.avalanche,
        accounts: [operatorPK],
        chainSelector: "43114",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalanche,
    },
    optimism: {
        name: "optimism",
        type: networkTypes.mainnet,
        id: 10,
        rpcUrls: rpcUrls.optimism,
        accounts: [operatorPK],
        chainSelector: "10",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimism,
    },
    polygonZkEvm: {
        name: "polygonZkEvm",
        type: networkTypes.mainnet,
        id: 137,
        rpcUrls: rpcUrls.polygonZkEvm,
        accounts: [operatorPK],
        chainSelector: "1101",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon,
    },
};

export const conceroNetworks: Record<ConceroNetworkNames, ConceroNetwork> = {
    ...testnetNetworks,
    ...mainnetNetworks,
    ...testingNetworks,
};

export default conceroNetworks;
