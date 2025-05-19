import { Address, Chain } from "viem";

export type ConceroTestingNetworkNames = "localhost";

export type ConceroNetwork = {
    id: number;
    name: string;
    type: "mainnet" | "testnet" | "localhost";
    chainSelector: string;
    accounts: string[];
    viemChain: Chain;
    confirmations: number;
    finalityConfirmations?: number;
    addresses?: {
        conceroVerifier?: Address;
        conceroRouter: Address;
    };
};

export type NetworkType = "mainnet" | "testnet";
