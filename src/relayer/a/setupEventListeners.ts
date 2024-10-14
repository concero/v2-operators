import { conceroNetworks } from "../../constants";
import { setupEventListener } from "../common/eventListener/setupEventListener";
import conceroInfraAbi from "../../abi/conceroInfraAbi";
import { onLogs } from "../common/eventListener/onLogs";
import { ConceroNetworkNames } from "../../types/ConceroNetwork";
import { getEnvAddress } from "../../utils/getEnvVar";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    const contractAddresses: Partial<Record<ConceroNetworkNames, string>> = {
        arbitrum: getEnvAddress("infraProxy", conceroNetworks.arbitrum.name)[0],
        base: getEnvAddress("infraProxy", conceroNetworks.base.name)[0],
        polygon: getEnvAddress("infraProxy", conceroNetworks.polygon.name)[0],
        avalanche: getEnvAddress("infraProxy", conceroNetworks.avalanche.name)[0],
    };

    for (const chainName in contractAddresses) {
        await setupEventListener(chainName, contractAddresses[chainName], conceroInfraAbi, onLogs, POLLING_INTERVAL_MS);
    }
}
