import { conceroNetworks } from "../constants";
import { ConceroNetwork } from "../types/ConceroNetwork";

export function getChainBySelector(selector: string): ConceroNetwork {
    for (const chain in conceroNetworks) {
        if (conceroNetworks[chain].chainSelector === selector) {
            return conceroNetworks[chain];
        }
    }

    throw new Error(`Chain with selector ${selector} not found`);
}
