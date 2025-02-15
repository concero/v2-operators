import {
    AppErrorEnum,
    conceroNetworks,
    globalConfig,
    mainnetNetworks,
    testnetNetworks,
} from "../../../constants";
import { AppError } from "../../common/utils";

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
        throw new AppError(AppErrorEnum.InvalidNetworkMode);
}

export type RelayerAConfig = {
    POLLING_INTERVAL_MS: number;
    networks: {
        conceroRouter: typeof conceroRouterNetworks;
        conceroVerifier: typeof conceroVerifierNetwork;
    };
};

export const config: RelayerAConfig = {
    networks: {
        conceroRouter: conceroRouterNetworks,
        conceroVerifier: conceroVerifierNetwork,
    },
};
