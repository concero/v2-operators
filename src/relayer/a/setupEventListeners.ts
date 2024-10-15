import { setupEventListener } from "../common/eventListener/setupEventListener";
import conceroInfraAbi from "../../abi/conceroInfraAbi";
import { getEnvAddress } from "../../utils/getEnvVar";
import { liveNetworks } from "../../constants";
import { onLogs } from "./onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    for (const network of liveNetworks) {
        const [contractAddress] = getEnvAddress("infraProxy", network.name);
        await setupEventListener(network.name, contractAddress, conceroInfraAbi, onLogs, POLLING_INTERVAL_MS);
    }
}
