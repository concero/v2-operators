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
import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { localhostViemChain } from "../relayer/common/utils/localhostViemChain";
import {
    ConceroMainnetNetworkNames,
    type ConceroNetwork,
    ConceroNetworkNames,
    ConceroTestnetNetworkNames,
    NetworkType,
} from "../types/ConceroNetwork";

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
        id: 31337,
        accounts: [operatorPK],
        chainSelector: "31337",
        confirmations: 1,
        viemChain: localhostViemChain,
        addresses: {
            conceroVerifier: getEnvVar("CONCERO_VERIFIER_ADDRESS_LOCALHOST"),
            conceroRouter: getEnvVar("CONCERO_ROUTER_ADDRESS_LOCALHOST"),
        },
    },
};

const testnetNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    sepolia: {
        name: "sepolia",
        type: networkTypes.testnet,
        id: 11155111,
        accounts: [operatorPK],
        chainSelector: "11155111",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: sepolia,
    },
    avalancheFuji: {
        name: "avalancheFuji",
        type: networkTypes.testnet,
        id: 43113,
        accounts: [operatorPK],
        chainSelector: "43113",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalancheFuji,
    },
    optimismSepolia: {
        name: "optimismSepolia",
        type: networkTypes.testnet,
        id: 11155420,
        accounts: [operatorPK],
        chainSelector: "11155420",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimismSepolia,
    },
    arbitrumSepolia: {
        name: "arbitrumSepolia",
        type: networkTypes.testnet,
        id: 421614,
        accounts: [operatorPK],
        chainSelector: "421614",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrumSepolia,
    },
    baseSepolia: {
        name: "baseSepolia",
        type: networkTypes.testnet,
        id: 84532,
        accounts: [operatorPK],
        chainSelector: "84532",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: baseSepolia,
    },
    polygonAmoy: {
        name: "polygonAmoy",
        type: networkTypes.testnet,
        id: 80002,
        accounts: [operatorPK],
        chainSelector: "80002",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygonAmoy,
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
    ...testnetNetworks,
    ...mainnetNetworks,
    ...testingNetworks,
};

export { conceroNetworks, mainnetNetworks, networkTypes, testnetNetworks };
