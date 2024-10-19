import { setupEventListener } from "../../common/eventListener/setupEventListener";
// import conceroRouterAbi from "../constants/ConceroRouter.json";
import { getEnvAddress } from "../../../utils/getEnvVar";
import { conceroNetworks } from "../../../constants";
import { onLogs } from "../eventListener/onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    //todo: in testing environment should listen to localhost
    const { abi: conceroRouterAbi } = await import("../constants/ConceroRouter.json");
    // ConceroRouter event listeners

    const network = conceroNetworks.localhost;
    const [contractAddress] = getEnvAddress("conceroRouter", network.name);
    await setupEventListener(network.name, contractAddress, conceroRouterAbi, onLogs, POLLING_INTERVAL_MS);

    // ConceroCLFRouter event listener
    // const clfNetwork = conceroNetworks.base;
    // const [contractAddress] = getEnvAddress("conceroCLFRouter", clfNetwork.name);
    // await setupEventListener(clfNetwork.name, contractAddress, conceroCLFRouterAbi, onLogs, POLLING_INTERVAL_MS);
}
