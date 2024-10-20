import { setupEventListener } from "../../common/eventListener/setupEventListener";

import { getEnvAddress } from "../../../utils/getEnvVar";
import { onLogs } from "./onLogs";
import { config } from "../constants/config";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    //todo: in testing environment should listen to localhost

    const { abi: conceroRouterAbi } = await import("../constants/ConceroRouter.json");
    const { abi: conceroCLFRouterAbi } = await import("../constants/CLFRouter.json");
    // ConceroRouter event listeners
    for (const network of config.networks.conceroRouter) {
        const [contractAddress] = getEnvAddress("conceroRouter", network.name);
        await setupEventListener(network.name, contractAddress, conceroRouterAbi, onLogs, POLLING_INTERVAL_MS);
    }

    // ConceroCLFRouter event listener
    const clfNetwork = config.networks.conceroCLFRouter;
    const [contractAddress] = getEnvAddress("conceroCLFRouter", clfNetwork.name);
    await setupEventListener(clfNetwork.name, contractAddress, conceroCLFRouterAbi, onLogs, POLLING_INTERVAL_MS);
}
