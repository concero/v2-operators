import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { getEnvAddress } from "../../common/utils/getEnvVar";
import { onRouterLogs, onVerifierLogs } from "./onLogs";
import { config } from "../constants/config";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    // ConceroRouter event listeners
    for (const [networkKey, network] of Object.entries(config.networks.conceroRouter)) {
        const [contractAddress] = getEnvAddress("routerProxy", network.name);
        await setupEventListener(network.name, contractAddress, onRouterLogs, POLLING_INTERVAL_MS);
    }

    // conceroVerifier event listener
    const clfNetwork = config.networks.conceroVerifier;
    const [contractAddress] = getEnvAddress("verifierProxy", clfNetwork.name);
    await setupEventListener(clfNetwork.name, contractAddress, onVerifierLogs, POLLING_INTERVAL_MS);
}
