import { conceroNetworks, mainnetNetworks, testnetNetworks } from "../../../constants";
import { config as globalConfig } from "../../../constants/config";

let conceroRouterNetworks;
let conceroVerifierNetwork;

switch (globalConfig.NETWORK_MODE) {
    case "testnet":
        conceroRouterNetworks = testnetNetworks;
        conceroVerifierNetwork = conceroNetworks.baseSepolia;
        break;
    case "localhost":
        conceroRouterNetworks = [conceroNetworks.localhost];
        conceroVerifierNetwork = conceroNetworks.localhost;
        break;
    case "mainnet":
        conceroRouterNetworks = mainnetNetworks;
        conceroVerifierNetwork = conceroNetworks.base;
        break;
    default:
        throw new Error("Invalid env.NETWORK_MODE");
}

export type RelayerAConfig = {
    POLLING_INTERVAL_MS: number;
    networks: {
        conceroRouter: typeof conceroRouterNetworks;
        conceroVerifier: typeof conceroVerifierNetwork;
    };
};

export const config: RelayerAConfig = {
    POLLING_INTERVAL_MS: 5000,
    networks: {
        conceroRouter: conceroRouterNetworks,
        conceroVerifier: conceroVerifierNetwork,
    },
};
