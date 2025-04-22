import {
    mainnetNetworks as v2MainnetNetworks,
    testnetNetworks as v2TestnetNetworks,
} from "@concero/v2-networks";
import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { localhostViemChain } from "../relayer/common/utils/localhostViemChain";
import {
    ConceroMainnetNetworkNames,
    type ConceroNetwork,
    ConceroNetworkNames,
    ConceroTestnetNetworkNames,
    NetworkType,
} from "../types/ConceroNetwork";
import { globalConfig } from "./globalConfig";

const DEFAULT_BLOCK_CONFIRMATIONS = 2;
const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

const testingNetworks: Record<"localhost", ConceroNetwork> = {
    localhost: {
        name: "localhost",
        type: "localhost",
        id: 1,
        accounts: [operatorPK],
        chainSelector: "1",
        confirmations: 1,
        viemChain: localhostViemChain,
    },
};

function createNetworkConfig<T extends string>(
    networks: Record<string, any>,
    networkType: NetworkType,
    accounts: string[],
): Record<T, ConceroNetwork> {
    return Object.fromEntries(
        Object.entries(networks).map(([key, network]) => {
            const networkKey = key as T;
            return [
                networkKey,
                {
                    name: network.name || networkKey,
                    type: networkType,
                    id: network.chainId,
                    accounts,
                    chainSelector: network.chainSelector || network.chainId.toString(),
                    confirmations: DEFAULT_BLOCK_CONFIRMATIONS,
                    viemChain: network.viemChain,
                }
            ];
        })
    ) as Record<T, ConceroNetwork>;
}

const testnetNetworks = {
    ...createNetworkConfig<ConceroTestnetNetworkNames>(
        v2TestnetNetworks,
        "testnet",
        [operatorPK]
    ),
    ...testingNetworks
};

const mainnetNetworks = createNetworkConfig<ConceroMainnetNetworkNames>(
    v2MainnetNetworks,
    "mainnet",
    [operatorPK]
);

const conceroNetworks: Record<ConceroNetworkNames, ConceroNetwork> = {
    ...testnetNetworks,
    ...mainnetNetworks,
};

const filterNetworks = (
    networkType: "mainnet" | "testnet" | "localhost",
): ConceroNetwork[] => {
    let networks: ConceroNetwork[] = [];
    const ignoredIds = globalConfig.IGNORED_NETWORK_IDS || [];

    switch (networkType) {
        case "localhost": {
            networks = Object.values(testingNetworks);
            break;
        }
        case "testnet": {
            networks = Object.values(testnetNetworks);
            break;
        }
        case "mainnet": {
            networks = Object.values(mainnetNetworks);
            break;
        }
    }

    return networks.filter(network => !ignoredIds.includes(network.id));
};

const activeNetworks: ConceroNetwork[] = filterNetworks(globalConfig.NETWORK_MODE);

export { activeNetworks, conceroNetworks, mainnetNetworks, testnetNetworks };
