import { Chain } from "viem";

export type ConceroMainnetNetworkNames =
    | "mainnet"
    | "arbitrum"
    | "optimism"
    | "polygon"
    | "polygonZkEvm"
    | "avalanche"
    | "base";
export type ConceroTestnetNetworkNames =
    | "sepolia"
    | "optimismSepolia"
    | "arbitrumSepolia"
    | "avalancheFuji"
    | "baseSepolia"
    | "polygonAmoy";
export type ConceroTestingNetworkNames = "localhost";
export type ConceroNetworkNames = ConceroMainnetNetworkNames | ConceroTestnetNetworkNames | ConceroTestingNetworkNames;

export type ConceroNetwork = {
    id: number;
    name: ConceroNetworkNames;
    type: "mainnet" | "testnet";
    chainSelector: string;
    accounts: string[];
    viemChain: Chain;
    confirmations: number;
    rpcUrls: string[];
};

export type NetworkType = "mainnet" | "testnet";
