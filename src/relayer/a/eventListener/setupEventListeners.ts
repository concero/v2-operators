import { setupEventListener } from "../../common/eventListener/setupEventListener";
import conceroRouterAbi from "../constants/conceroRouterAbi";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { liveNetworks } from "../../../constants";
import { onLogs } from "./onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    for (const network of liveNetworks) {
        const [contractAddress] = getEnvAddress("conceroRouter", network.name);
        await setupEventListener(network.name, contractAddress, conceroRouterAbi, onLogs, POLLING_INTERVAL_MS);
    }
}
