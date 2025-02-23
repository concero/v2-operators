import { conceroNetworks } from "../../../constants";
import conceroVerifierAbi from "../../a/constants/conceroVerifierAbi";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { getEnvAddress } from "../../common/utils/getEnvVar";
import { onLogs } from "./onLogs";

export async function setupEventListeners(POLLING_INTERVAL_MS: number) {
    const network = conceroNetworks.base;
    const [contractAddress] = getEnvAddress("router", network.name);
    await setupEventListener(
        network.name,
        contractAddress,
        conceroVerifierAbi,
        onLogs,
        POLLING_INTERVAL_MS,
    );
}
