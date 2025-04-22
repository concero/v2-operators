import { conceroNetworks } from "../../../constants";
import conceroVerifierAbi from "../../a/constants/conceroVerifierAbi";
import { deploymentsManager } from "../../common/constants/deploymentsManager";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { onLogs } from "./onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    const network = conceroNetworks.base;
    const contractAddress = await deploymentsManager.getRouterByChainName(network.name);

    await setupEventListener(
        network.name,
        contractAddress,
        conceroVerifierAbi,
        onLogs,
        POLLING_INTERVAL_MS,
    );
}
