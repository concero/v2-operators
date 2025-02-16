function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
import { arbitrum, arbitrumSepolia, avalanche, avalancheFuji, base, baseSepolia, mainnet, optimism, optimismSepolia, polygon, polygonAmoy, sepolia } from "viem/chains";
import { urls } from "./rpcUrls";
import { getEnvVar } from "../utils/getEnvVar";
var DEFAULT_BLOCK_CONFIRMATIONS = 2;
var operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");
export var networkTypes = {
    mainnet: "mainnet",
    testnet: "testnet"
};
export var networkEnvKeys = {
    // mainnets
    mainnet: "MAINNET",
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
    polygonAmoy: "POLYGON_AMOY"
};
export var testnetNetworks = {
    sepolia: {
        name: "sepolia",
        type: networkTypes.testnet,
        id: 11155111,
        rpcUrls: urls.sepolia,
        accounts: [
            operatorPK
        ],
        chainSelector: "16015286601757825753",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: sepolia
    },
    avalancheFuji: {
        name: "avalancheFuji",
        type: networkTypes.testnet,
        id: 43113,
        rpcUrls: urls.avalancheFuji,
        accounts: [
            operatorPK
        ],
        chainSelector: "14767482510784806043",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalancheFuji
    },
    optimismSepolia: {
        name: "optimismSepolia",
        type: networkTypes.testnet,
        id: 11155420,
        rpcUrls: urls.optimismSepolia,
        accounts: [
            operatorPK
        ],
        chainSelector: "5224473277236331295",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimismSepolia
    },
    arbitrumSepolia: {
        name: "arbitrumSepolia",
        type: networkTypes.testnet,
        id: 421614,
        rpcUrls: urls.arbitrumSepolia,
        accounts: [
            operatorPK
        ],
        chainSelector: "3478487238524512106",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrumSepolia
    },
    baseSepolia: {
        name: "baseSepolia",
        type: networkTypes.testnet,
        id: 84532,
        rpcUrls: urls.baseSepolia,
        accounts: [
            operatorPK
        ],
        chainSelector: "10344971235874465080",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: baseSepolia
    },
    polygonAmoy: {
        name: "polygonAmoy",
        type: networkTypes.testnet,
        id: 80002,
        rpcUrls: urls.polygonAmoy,
        accounts: [
            operatorPK
        ],
        chainSelector: "16281711391670634445",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygonAmoy
    }
};
export var mainnetNetworks = {
    mainnet: {
        name: "mainnet",
        type: networkTypes.mainnet,
        id: 1,
        rpcUrls: urls.mainnet,
        accounts: [
            operatorPK
        ],
        chainSelector: "1",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: mainnet
    },
    base: {
        name: "base",
        type: networkTypes.mainnet,
        id: 8453,
        rpcUrls: urls.base,
        accounts: [
            operatorPK
        ],
        chainSelector: "15971525489660198786",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: base
    },
    arbitrum: {
        name: "arbitrum",
        type: networkTypes.mainnet,
        id: 42161,
        rpcUrls: urls.arbitrum,
        accounts: [
            operatorPK
        ],
        chainSelector: "4949039107694359620",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: arbitrum
    },
    polygon: {
        name: "polygon",
        type: networkTypes.mainnet,
        id: 137,
        rpcUrls: urls.polygon,
        accounts: [
            operatorPK
        ],
        chainSelector: "4051577828743386545",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon
    },
    avalanche: {
        name: "avalanche",
        type: networkTypes.mainnet,
        id: 43114,
        rpcUrls: urls.avalanche,
        accounts: [
            operatorPK
        ],
        chainSelector: "6433500567565415381",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: avalanche
    },
    optimism: {
        name: "optimism",
        type: networkTypes.mainnet,
        id: 10,
        rpcUrls: urls.optimism,
        accounts: [
            operatorPK
        ],
        chainSelector: "10",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: optimism
    },
    polygonZkEvm: {
        name: "polygonZkEvm",
        type: networkTypes.mainnet,
        id: 137,
        rpcUrls: urls.polygonZkEvm,
        accounts: [
            operatorPK
        ],
        chainSelector: "137",
        confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
        viemChain: polygon
    }
};
export var conceroNetworks = _object_spread({}, testnetNetworks, mainnetNetworks);
export default conceroNetworks;
