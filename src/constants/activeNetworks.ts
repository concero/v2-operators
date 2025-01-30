import { ConceroNetwork } from "../types/ConceroNetwork";
import conceroNetworks from "./conceroNetworks";
import { config } from "./config";

const filterWhitelistedNetworks = (networks: Record<string, ConceroNetwork>): ConceroNetwork[] => {
    const whitelistedIds = config.WHITELISTED_NETWORK_IDS[config.NETWORK_MODE];
    return Object.values(networks).filter(network => whitelistedIds.includes(network.id));
};

export const activeNetworks: ConceroNetwork[] = filterWhitelistedNetworks(conceroNetworks);
