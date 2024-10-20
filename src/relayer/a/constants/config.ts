// Determine the environment
import { conceroNetworks, mainnetNetworks, testnetNetworks } from "../../../constants";

const isMainnet = process.env.NETWORK_MODE === "mainnet";
const isTestnet = process.env.NETWORK_MODE === "testnet";
const isLocalhost = process.env.NETWORK_MODE === "localhost";

let conceroRouterNetworks;
let conceroCLFRouterNetwork;

if (isTestnet) {
    conceroRouterNetworks = testnetNetworks;
    conceroCLFRouterNetwork = conceroNetworks.baseSepolia;
} else if (isLocalhost) {
    conceroRouterNetworks = [conceroNetworks.localhost];
    conceroCLFRouterNetwork = conceroNetworks.localhost;
} else if (isMainnet) {
    conceroRouterNetworks = mainnetNetworks;
    conceroCLFRouterNetwork = conceroNetworks.base;
} else throw new Error("Invalid env.NETWORK_MODE");

export interface Config {
    POLLING_INTERVAL_MS: number;
    networks: {
        conceroRouter: typeof conceroRouterNetworks;
        conceroCLFRouter: typeof conceroCLFRouterNetwork;
    };
}

export const config: Config = {
    POLLING_INTERVAL_MS: 5000,
    networks: {
        conceroRouter: conceroRouterNetworks,
        conceroCLFRouter: conceroCLFRouterNetwork,
    },
};
