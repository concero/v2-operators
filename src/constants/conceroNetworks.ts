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
    saigon,
} from "viem/chains";
import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { localhostViemChain } from "../relayer/common/utils/localhostViemChain";
import {
    ConceroMainnetNetworkNames,
    type ConceroNetwork,
    ConceroNetworkNames,
    ConceroTestnetNetworkNames,
    NetworkType,
} from "../types/ConceroNetwork";
import { globalConfig } from "./globalConfig";
import { astarShibuya } from "./customViemChains";

const DEFAULT_BLOCK_CONFIRMATIONS = 2;
const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

const networkTypes: Record<NetworkType, NetworkType> = {
    mainnet: "mainnet",
    testnet: "testnet",
};

const testingNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    localhost: {
        name: "localhost",
        type: networkTypes.testnet,
        id: 1,
        accounts: [operatorPK],
        chainSelector: "1",
        confirmations: 1,
        viemChain: localhostViemChain,
        addresses: {
            conceroVerifier: getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST"),
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST"),
        },
    },
};

const testnetNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    // sepolia: {
    //     name: "sepolia",
    //     type: networkTypes.testnet,
    //     id: 11155111,
    //     accounts: [operatorPK],
    //     chainSelector: "11155111",
    //     confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
    //     viemChain: sepolia,
    // },
    avalancheFuji: {
        name: "avalancheFuji",
        type: networkTypes.testnet,
        id: 43113,
        accounts: [operatorPK],
        chainSelector: "43113",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalancheFuji,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_AVALANCHE_FUJI"),
        },
    },
    optimismSepolia: {
        name: "optimismSepolia",
        type: networkTypes.testnet,
        id: 11155420,
        accounts: [operatorPK],
        chainSelector: "11155420",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimismSepolia,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_OPTIMISM_SEPOLIA"),
        },
    },
    arbitrumSepolia: {
        name: "arbitrumSepolia",
        type: networkTypes.testnet,
        id: 421614,
        accounts: [operatorPK],
        chainSelector: "421614",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrumSepolia,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_ARBITRUM_SEPOLIA"),
            conceroVerifier: getEnvVar("CONCERO_VERIFIER_PROXY_ARBITRUM_SEPOLIA"),
        },
    },
    baseSepolia: {
        name: "baseSepolia",
        type: networkTypes.testnet,
        id: 84532,
        accounts: [operatorPK],
        chainSelector: "84532",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: baseSepolia,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_BASE_SEPOLIA"),
        },
    },
    polygonAmoy: {
        name: "polygonAmoy",
        type: networkTypes.testnet,
        id: 80002,
        accounts: [operatorPK],
        chainSelector: "80002",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygonAmoy,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_POLYGON_AMOY"),
        },
    },
    astarShibuya: {
        name: "astarShibuya",
        type: networkTypes.testnet,
        id: 81,
        accounts: [operatorPK],
        chainSelector: "81",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: astarShibuya,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_ASTAR_SHIBUYA"),
        },
    },
    roninSaigon: {
        name: "roninSaigon",
        type: networkTypes.testnet,
        id: 2021,
        accounts: [operatorPK],
        chainSelector: "2021",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: saigon,
        addresses: {
            conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_RONIN_SAIGON"),
        },
    },
};
const mainnetNetworks: Record<ConceroMainnetNetworkNames, ConceroNetwork> = {
    ethereum: {
        name: "ethereum",
        type: networkTypes.mainnet,
        id: 1,
        accounts: [operatorPK],
        chainSelector: "1",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: mainnet,
    },
    base: {
        name: "base",
        type: networkTypes.mainnet,
        id: 8453,
        accounts: [operatorPK],
        chainSelector: "8453",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: base,
    },
    arbitrum: {
        name: "arbitrum",
        type: networkTypes.mainnet,
        id: 42161,
        accounts: [operatorPK],
        chainSelector: "42161",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrum,
    },
    polygon: {
        name: "polygon",
        type: networkTypes.mainnet,
        id: 137,
        accounts: [operatorPK],
        chainSelector: "137",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon,
    },
    avalanche: {
        name: "avalanche",
        type: networkTypes.mainnet,
        id: 43114,
        accounts: [operatorPK],
        chainSelector: "43114",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalanche,
    },
    optimism: {
        name: "optimism",
        type: networkTypes.mainnet,
        id: 10,
        accounts: [operatorPK],
        chainSelector: "10",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimism,
    },
    polygonZkEvm: {
        name: "polygonZkEvm",
        type: networkTypes.mainnet,
        id: 137,
        accounts: [operatorPK],
        chainSelector: "1101",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon,
    },
};

const conceroNetworks: Record<ConceroNetworkNames, ConceroNetwork> = {
    ...testingNetworks,
    ...testnetNetworks,
    ...mainnetNetworks,
};

const filterWhitelistedNetworks = (
    networkType: "mainnet" | "testnet" | "localhost",
): ConceroNetwork[] => {
    let filteredNetworks: ConceroNetwork[] = [];
    const whitelistedIds = globalConfig.WHITELISTED_NETWORK_IDS[networkType];

    switch (networkType) {
        case "localhost": {
            filteredNetworks = Object.values(testingNetworks);
            break;
        }
        case "testnet": {
            filteredNetworks = Object.values(testnetNetworks).filter(network =>
                whitelistedIds.includes(network.id),
            );
            break;
        }
        case "mainnet": {
            filteredNetworks = Object.values(mainnetNetworks).filter(network =>
                whitelistedIds.includes(network.id),
            );
            break;
        }
    }

    return filteredNetworks;
};

const activeNetworks: ConceroNetwork[] = filterWhitelistedNetworks(globalConfig.NETWORK_MODE);

export { activeNetworks, conceroNetworks, mainnetNetworks, networkTypes, testnetNetworks };
