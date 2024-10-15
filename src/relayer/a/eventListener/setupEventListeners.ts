import { setupEventListener } from "../../common/eventListener/setupEventListener";
import conceroRouterAbi from "../constants/conceroRouterAbi";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { conceroNetworks, liveNetworks } from "../../../constants";
import { onLogs } from "./onLogs";
import conceroCLFRouterAbi from "../constants/conceroCLFRouterAbi";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    //set up ConceroRouter event listeners
    for (const network of liveNetworks) {
        const [contractAddress] = getEnvAddress("conceroRouter", network.name);
        await setupEventListener(network.name, contractAddress, conceroRouterAbi, onLogs, POLLING_INTERVAL_MS);
    }

    //set up ConceroCLFRouter event listener
    const clfNetwork = conceroNetworks.base;
    const [contractAddress] = getEnvAddress("conceroCLFRouter", clfNetwork.name);
    await setupEventListener(clfNetwork.name, contractAddress, conceroCLFRouterAbi, onLogs, POLLING_INTERVAL_MS);
}
