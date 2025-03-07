import { EventEmitter } from "node:events";
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
        conceroVerifierNetwork = conceroNetworks.arbitrumSepolia;
        break;
    case "localhost":
        conceroRouterNetworks = [conceroNetworks.localhost];
        conceroVerifierNetwork = conceroNetworks.localhost;
        break;
    case "mainnet":
        conceroRouterNetworks = mainnetNetworks;
        conceroVerifierNetwork = conceroNetworks.arbitrum;
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
    eventEmitter: EventEmitter;
};

export const config: RelayerAConfig = {
    networks: {
        conceroRouter: conceroRouterNetworks,
        conceroVerifier: conceroVerifierNetwork,
    },
    eventEmitter: new EventEmitter(),
};
