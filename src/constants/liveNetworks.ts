import { ConceroNetwork } from "../types/ConceroNetwork";
import conceroNetworks from "./conceroNetworks";

export const liveNetworks: ConceroNetwork[] =
    process.env.NETWORK_MODE === "mainnet"
        ? [conceroNetworks.base, conceroNetworks.arbitrum, conceroNetworks.polygon, conceroNetworks.avalanche]
        : process.env.NETWORK_MODE === "testnet"
        ? []
        : [conceroNetworks.localhost];
