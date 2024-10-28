import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { onCLFRouterLogs, onRouterLogs } from "./onLogs";
import { config } from "../constants/config";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    // ConceroRouter event listeners
    for (const network of config.networks.conceroRouter) {
        const [contractAddress] = getEnvAddress("routerProxy", network.name);
        await setupEventListener(network.name, contractAddress, onRouterLogs, POLLING_INTERVAL_MS);
    }

    // ConceroCLFRouter event listener
    const clfNetwork = config.networks.conceroCLFRouter;
    const [contractAddress] = getEnvAddress("clfRouterProxy", clfNetwork.name);
    await setupEventListener(clfNetwork.name, contractAddress, onCLFRouterLogs, POLLING_INTERVAL_MS);
}
