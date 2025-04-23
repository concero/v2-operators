import { globalConfig } from "../../../constants";
import { deploymentsManager } from "../../common/managers/DeploymentManager";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { config } from "../constants";
import { onRouterLogs, onVerifierLogs } from "./onLogs";
import { networkManager } from "../../common/managers/NetworkManager";

export async function setupEventListeners() {
    // ConceroRouter event listeners
    for (const [networkKey, network] of Object.entries(config.networks.conceroRouter)) {
        const conceroRouterAddress = await deploymentsManager.getRouterByChainName(network.name);

        await setupEventListener(
            network,
            conceroRouterAddress,
            onRouterLogs,
            globalConfig.POLLING_INTERVAL_MS,
        );
    }

    await setupEventListener(
        networkManager.getVerifierNetwork(),
        deploymentsManager.getConceroVerifier(),
        onVerifierLogs,
        globalConfig.POLLING_INTERVAL_MS,
    );
}
