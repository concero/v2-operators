import { Chain } from "viem";

export type ConceroNetworkNames =
    | "localhost"
    | "mainnet"
    | "arbitrum"
    | "optimism"
    | "polygon"
    | "polygonZkEvm"
    | "avalanche"
    | "base"
    | "sepolia"
    | "optimismSepolia"
    | "arbitrumSepolia"
    | "avalancheFuji"
    | "baseSepolia"
    | "polygonAmoy";

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
