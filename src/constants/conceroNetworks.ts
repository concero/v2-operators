import {
    arbitrum,
    arbitrumSepolia,
    avalanche,
    avalancheFuji,
    base,
    baseSepolia,
    bitlayerTestnet,
    blastSepolia,
    botanixTestnet,
    bscTestnet,
    celoAlfajores,
    cronosTestnet,
    gnosisChiado,
    hashkeyTestnet,
    inkSepolia,
    lineaSepolia,
    mainnet,
    mantleSepoliaTestnet,
    megaethTestnet,
    modeTestnet,
    monadTestnet,
    optimism,
    optimismSepolia,
    polygon,
    polygonAmoy,
    saigon,
    scrollSepolia,
    seiTestnet,
    sepolia,
    shibariumTestnet,
    soneiumMinato,
    sonicBlazeTestnet,
    unichainSepolia,
    xLayerTestnet,
    zircuitTestnet,
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
import { apechainCurtis, coreTestnet } from "./customViemChains";

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
    },
};

const accounts = [operatorPK];

const testnetNetworks: Record<ConceroTestnetNetworkNames, ConceroNetwork> = {
    avalancheFuji: {
        name: "avalancheFuji",
        type: networkTypes.testnet,
        id: 43113,
        accounts,
        chainSelector: "43113",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalancheFuji,
    },
    arbitrumSepolia: {
        name: "arbitrumSepolia",
        type: networkTypes.testnet,
        id: 421614,
        accounts,
        chainSelector: "421614",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrumSepolia,
    },
    baseSepolia: {
        name: "baseSepolia",
        type: networkTypes.testnet,
        id: 84532,
        accounts,
        chainSelector: "84532",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: baseSepolia,
    },
    // astarShibuya: {
    //     name: "astarShibuya",
    //     type: networkTypes.testnet,
    //     id: 81,
    //     accounts,
    //     chainSelector: "81",
    //     confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
    //     viemChain: astarShibuya,
    //     addresses: {
    //         conceroRouter: getEnvVar("CONCERO_ROUTER_PROXY_ASTAR_SHIBUYA"),
    //     },
    // },
    roninSaigon: {
        name: "roninSaigon",
        type: networkTypes.testnet,
        id: 2021,
        accounts,
        chainSelector: "2021",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: saigon,
    },
    megaethTestnet: {
        name: "megaethTestnet",
        type: networkTypes.testnet,
        id: 6342,
        accounts,
        chainSelector: "6342",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: megaethTestnet,
    },
    sonicBlaze: {
        name: "sonicBlaze",
        type: networkTypes.testnet,
        id: 57054,
        accounts,
        chainSelector: "57054",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: sonicBlazeTestnet,
    },
    monadTestnet: {
        name: "monadTestnet",
        type: networkTypes.testnet,
        id: 10_143,
        accounts,
        chainSelector: "10143",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: monadTestnet,
    },
    sepolia: {
        name: "sepolia",
        type: networkTypes.testnet,
        id: 11155111,
        accounts,
        chainSelector: "11155111",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: sepolia,
    },
    lineaSepolia: {
        name: "lineaSepolia",
        type: networkTypes.testnet,
        id: 59141,
        accounts,
        chainSelector: "59141",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: lineaSepolia,
    },
    bnbTestnet: {
        name: "bnbTestnet",
        type: networkTypes.testnet,
        id: 97,
        accounts,
        chainSelector: "97",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: bscTestnet,
    },
    soneiumMinato: {
        name: "soneiumMinato",
        type: networkTypes.testnet,
        id: 1946,
        accounts,
        chainSelector: "1946",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: soneiumMinato,
    },
    apechainCurtis: {
        name: "apechainCurtis",
        type: networkTypes.testnet,
        id: 33111,
        accounts,
        chainSelector: "33111",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: apechainCurtis,
    },
    optimismSepolia: {
        name: "optimismSepolia",
        type: networkTypes.testnet,
        id: 11155420,
        accounts,
        chainSelector: "11155420",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimismSepolia,
    },
    polygonAmoy: {
        name: "polygonAmoy",
        type: networkTypes.testnet,
        id: 80002,
        accounts,
        chainSelector: "80002",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygonAmoy,
    },
    bitlayerTestnet: {
        name: "bitlayerTestnet",
        type: networkTypes.testnet,
        id: 200810,
        accounts,
        chainSelector: "200810",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: bitlayerTestnet,
    },
    blastSepolia: {
        name: "blastSepolia",
        type: networkTypes.testnet,
        id: 168587773,
        accounts,
        chainSelector: "1685877",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: blastSepolia,
    },
    botanixTestnet: {
        name: "botanixTestnet",
        type: networkTypes.testnet,
        id: 3636,
        accounts,
        chainSelector: "3636",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: botanixTestnet,
    },
    celoAlfajores: {
        name: "celoAlfajores",
        type: networkTypes.testnet,
        id: 44_787,
        accounts,
        chainSelector: "44787",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: celoAlfajores,
    },
    coreTestnet: {
        name: "coreTestnet",
        type: networkTypes.testnet,
        id: 1114,
        accounts,
        chainSelector: "1114",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: coreTestnet,
    },
    cronosTestnet: {
        name: "cronosTestnet",
        type: networkTypes.testnet,
        id: 338,
        accounts,
        chainSelector: "338",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: cronosTestnet,
    },
    gnosisChiado: {
        name: "gnosisChiado",
        type: networkTypes.testnet,
        id: 10_200,
        accounts,
        chainSelector: "10200",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: gnosisChiado,
    },
    hashkeyTestnet: {
        name: "hashkeyTestnet",
        type: networkTypes.testnet,
        id: 133,
        accounts,
        chainSelector: "133",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: hashkeyTestnet,
    },
    inkSepolia: {
        name: "inkSepolia",
        type: networkTypes.testnet,
        id: 763373,
        accounts,
        chainSelector: "763373",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: inkSepolia,
    },
    mantleSepolia: {
        name: "mantleSepolia",
        type: networkTypes.testnet,
        id: 5003,
        accounts,
        chainSelector: "5003",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: mantleSepoliaTestnet,
    },
    scrollSepolia: {
        name: "scrollSepolia",
        type: networkTypes.testnet,
        id: 534_351,
        accounts,
        chainSelector: "534351",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: scrollSepolia,
    },
    seiTestnet: {
        name: "seiTestnet",
        type: networkTypes.testnet,
        id: 1328,
        accounts,
        chainSelector: "1328",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: seiTestnet,
    },
    shibariumPuppynet: {
        name: "shibariumPuppynet",
        type: networkTypes.testnet,
        id: 157,
        accounts,
        chainSelector: "157",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: shibariumTestnet,
    },
    unichainSepolia: {
        name: "unichainSepolia",
        type: networkTypes.testnet,
        id: 1301,
        accounts,
        chainSelector: "1301",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: unichainSepolia,
    },
    xlayerSepolia: {
        name: "xlayerSepolia",
        type: networkTypes.testnet,
        id: 195,
        accounts,
        chainSelector: "195",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: xLayerTestnet,
    },
    zircuitTestnet: {
        name: "zircuitTestnet",
        type: networkTypes.testnet,
        id: 48899,
        accounts,
        chainSelector: "48899",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: zircuitTestnet,
    },
    modeTestnet: {
        name: "modeTestnet",
        type: networkTypes.testnet,
        id: 919,
        accounts,
        chainSelector: "919",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: modeTestnet,
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
