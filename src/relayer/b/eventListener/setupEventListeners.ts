import { setupEventListener } from "../../common/eventListener/setupEventListener";
import conceroCLFRouterAbi from "../../a/constants/conceroCLFRouterAbi";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { conceroNetworks } from "../../../constants";
import { onLogs } from "./onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    const network = conceroNetworks.base;
    const [contractAddress] = getEnvAddress("routerProxy", network.name);
    await setupEventListener(network.name, contractAddress, conceroCLFRouterAbi, onLogs, POLLING_INTERVAL_MS);
}
