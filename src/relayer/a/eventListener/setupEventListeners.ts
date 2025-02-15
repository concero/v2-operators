import { globalConfig } from "../../../constants";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { getEnvAddress } from "../../common/utils";
import { config } from "../constants";
import { onRouterLogs, onVerifierLogs } from "./onLogs";

export async function setupEventListeners() {
    // ConceroRouter event listeners
    for (const [networkKey, network] of Object.entries(config.networks.conceroRouter)) {
        const [contractAddress] = getEnvAddress("routerProxy", network.name);

        await setupEventListener(
            network,
            contractAddress,
            onRouterLogs,
            globalConfig.POLLING_INTERVAL_MS,
        );
    }

    // conceroVerifier event listener
    const verifierNetwork = config.networks.conceroVerifier;
    const [contractAddress] = getEnvAddress("verifierProxy", verifierNetwork.name);

    await setupEventListener(
        verifierNetwork,
        contractAddress,
        onVerifierLogs,
        globalConfig.POLLING_INTERVAL_MS,
    );
}
