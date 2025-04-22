import { Address, Chain } from "viem";

export type ConceroMainnetNetworkNames =
    | "ethereum"
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

export type ConceroNetworkNames =
    | ConceroMainnetNetworkNames
    | ConceroTestnetNetworkNames
    | ConceroTestingNetworkNames;

export type ConceroNetwork = {
    id: number;
    name: ConceroNetworkNames;
    type: "mainnet" | "testnet" | "localhost";
    chainSelector: string;
    accounts: string[];
    viemChain: Chain;
    confirmations: number;
    addresses: {
        conceroVerifier?: Address;
        conceroRouter: Address;
    };
};

export type NetworkType = "mainnet" | "testnet";
