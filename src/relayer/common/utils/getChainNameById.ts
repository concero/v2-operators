import { globalConfig } from "../../../constants";
import { httpClient } from "./httpClient";

export const getChainNameById = async (chainId: Number) => {
    const chainList = await httpClient.get(
        `${globalConfig.URLS.CONCERO_RPCS}supported-chains.json`,
    );

    return chainList[globalConfig.NETWORK_MODE][chainId.toString()];
};
