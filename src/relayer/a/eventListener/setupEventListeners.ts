import { globalConfig } from "../../../constants";
import { deploymentsManager } from "../../common/managers/DeploymentManager";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { onRouterLogs, onVerifierLogs } from "./onLogs";
import { networkManager } from "../../common/managers/NetworkManager";

export async function setupEventListeners() {
    // ConceroRouter event listeners
    const activeNetworks = networkManager.getActiveNetworks();
    activeNetworks.forEach(async network => {
        const routerAddress = await deploymentsManager.getRouterByChainName(network.name);
        await setupEventListener(
            network,
            routerAddress,
            onRouterLogs,
            globalConfig.POLLING_INTERVAL_MS,
        );
    });

    const verifierNetwork = networkManager.getVerifierNetwork();
    const verifierAddress = await deploymentsManager.getConceroVerifier();
    await setupEventListener(
        verifierNetwork,
        verifierAddress,
        onVerifierLogs,
        globalConfig.POLLING_INTERVAL_MS,
    );
}
