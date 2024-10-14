import { setupEventListener } from "../common/eventListener/setupEventListener";
import conceroInfraAbi from "../../abi/conceroInfraAbi";
import { onLogs } from "../common/eventListener/onLogs";
import { getEnvAddress } from "../../utils/getEnvVar";
import { liveNetworks } from "../../constants";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    for (const network of liveNetworks) {
        const [contractAddress] = getEnvAddress("infraProxy", network.name);
        await setupEventListener(network.name, contractAddress, conceroInfraAbi, onLogs, POLLING_INTERVAL_MS);
    }
}
