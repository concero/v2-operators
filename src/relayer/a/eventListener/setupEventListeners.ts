import { globalConfig } from "../../../constants";
import { deploymentsManager } from "../../common/constants/deploymentsManager";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { getEnvAddress } from "../../common/utils";
import { config } from "../constants";
import { onRouterLogs, onVerifierLogs } from "./onLogs";

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

    // conceroVerifier event listener
    const verifierNetwork = config.networks.conceroVerifier;
    const conceroVerifierAddress = await deploymentsManager.getConceroVerifier();

    await setupEventListener(
        verifierNetwork,
        conceroVerifierAddress,
        onVerifierLogs,
        globalConfig.POLLING_INTERVAL_MS,
    );
}
