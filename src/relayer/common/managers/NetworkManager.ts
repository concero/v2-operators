import { ConceroNetwork, NetworkType } from "../../../types/ConceroNetwork";
import {
    IDeploymentsManager,
    INetworkManager,
    IRpcManager,
    NetworkUpdateListener,
} from "../../../types/managers";
import { globalConfig } from "../../../constants/globalConfig";
import { fetchNetworkConfigs } from "../utils/fetchNetworkConfigs";
import { getEnvVar } from "../utils/getEnvVar";
import { localhostViemChain } from "../utils/localhostViemChain";
import { logger } from "../utils/logger";

export class NetworkManager implements INetworkManager {
    private static instance: NetworkManager;

    private mainnetNetworks: Record<string, ConceroNetwork> = {};
    private testnetNetworks: Record<string, ConceroNetwork> = {};
    private allNetworks: Record<string, ConceroNetwork> = {};
    private activeNetworks: ConceroNetwork[] = [];
    private initialized: boolean = false;
    private updateIntervalId: NodeJS.Timeout | null = null;
    private rpcManager: IRpcManager | null = null;
    private deploymentsManager: IDeploymentsManager | null = null;
    private updateListeners: NetworkUpdateListener[] = [];
    private static DEFAULT_BLOCK_CONFIRMATIONS = 2;
    private static NETWORK_UPDATE_INTERVAL_MS = 30 * 1000;

    private constructor(rpcManager?: IRpcManager, deploymentsManager?: IDeploymentsManager) {
        this.rpcManager = rpcManager || null;
        this.deploymentsManager = deploymentsManager || null;

        if (this.rpcManager) {
            this.registerUpdateListener(this.rpcManager as NetworkUpdateListener);
        }

        if (this.deploymentsManager && "onNetworksUpdated" in this.deploymentsManager) {
            this.registerUpdateListener(this.deploymentsManager as NetworkUpdateListener);
        }
    }

    public static getInstance(
        rpcManager?: IRpcManager,
        deploymentsManager?: IDeploymentsManager,
    ): NetworkManager {
        if (!NetworkManager.instance) {
            NetworkManager.instance = new NetworkManager(rpcManager, deploymentsManager);
        }
        return NetworkManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.updateNetworks();
            this.setupUpdateCycle();
            this.initialized = true;
            logger.debug("NetworkManager initialized successfully");
        } catch (error) {
            logger.error("Failed to initialize networks:", error);
            throw error;
        }
    }

    public registerUpdateListener(listener: NetworkUpdateListener): void {
        if (!this.updateListeners.includes(listener)) {
            this.updateListeners.push(listener);
        }
    }

    public unregisterUpdateListener(listener: NetworkUpdateListener): void {
        const index = this.updateListeners.indexOf(listener);
        if (index !== -1) {
            this.updateListeners.splice(index, 1);
        }
    }

    public getMainnetNetworks(): Record<string, ConceroNetwork> {
        return { ...this.mainnetNetworks };
    }

    public getTestnetNetworks(): Record<string, ConceroNetwork> {
        return { ...this.testnetNetworks };
    }

    public getAllNetworks(): Record<string, ConceroNetwork> {
        return { ...this.allNetworks };
    }

    public getActiveNetworks(): ConceroNetwork[] {
        return [...this.activeNetworks];
    }

    public getNetworkById(chainId: number): ConceroNetwork | undefined {
        return Object.values(this.allNetworks).find(network => network.id === chainId);
    }

    public getNetworkByName(name: string): ConceroNetwork | undefined {
        return Object.values(this.allNetworks).find(network => network.name === name);
    }

    public getNetworkBySelector(selector: string): ConceroNetwork | undefined {
        return Object.values(this.allNetworks).find(network => network.chainSelector === selector);
    }

    public getVerifierNetwork(): ConceroNetwork | undefined {
        if (globalConfig.NETWORK_MODE === "mainnet") {
            return this.mainnetNetworks["arbitrum"];
        } else if (globalConfig.NETWORK_MODE === "testnet") {
            return this.testnetNetworks["arbitrumSepolia"];
        } else if (globalConfig.NETWORK_MODE === "localhost") {
            return this.testnetNetworks["localhost"];
        }
    }

    public async forceUpdate(): Promise<void> {
        await this.updateNetworks();

        // Explicitly trigger manual updates in dependent managers
        if (this.rpcManager) {
            await this.rpcManager.updateRpcsForNetworks(this.activeNetworks);
        }

        if (this.deploymentsManager) {
            await this.deploymentsManager.updateDeployments();
        }
    }

    private setupUpdateCycle(): void {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }

        this.updateIntervalId = setInterval(
            () => this.updateNetworks().catch(err => logger.error("Network update failed:", err)),
            NetworkManager.NETWORK_UPDATE_INTERVAL_MS,
        );
    }

    private async updateNetworks(): Promise<void> {
        try {
            const { mainnetNetworks: fetchedMainnet, testnetNetworks: fetchedTestnet } =
                await fetchNetworkConfigs();

            const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

            // Store previous network IDs to detect new networks
            const previousNetworkIds = new Set(
                Object.values(this.allNetworks).map(network => network.id),
            );

            // Update network collections
            this.mainnetNetworks = this.createNetworkConfig(fetchedMainnet, "mainnet", [
                operatorPK,
            ]);

            // const testingNetworks = this.getTestingNetworks(operatorPK);
            this.testnetNetworks = {
                ...this.createNetworkConfig(fetchedTestnet, "testnet", [operatorPK]),
                // ...testingNetworks,
            };

            this.allNetworks = {
                ...this.testnetNetworks,
                ...this.mainnetNetworks,
            };

            this.activeNetworks = this.filterNetworks(globalConfig.NETWORK_MODE);

            // Notify listeners of update
            this.notifyListeners();

            logger.debug(`Networks updated - Active networks: ${this.activeNetworks.length}`);
        } catch (error) {
            logger.error("Failed to update networks:", error);
            throw error;
        }
    }

    private notifyListeners(): void {
        for (const listener of this.updateListeners) {
            try {
                listener.onNetworksUpdated(this.activeNetworks);
            } catch (error) {
                logger.error("Error in network update listener:", error);
            }
        }
    }

    private createNetworkConfig<T extends string>(
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
                        confirmations: NetworkManager.DEFAULT_BLOCK_CONFIRMATIONS,
                        viemChain: network.viemChain,
                    },
                ];
            }),
        ) as Record<T, ConceroNetwork>;
    }

    private getTestingNetworks(operatorPK: string): Record<"localhost", ConceroNetwork> {
        return {
            localhost: {
                name: "localhost",
                type: "localhost",
                id: 1,
                accounts: [operatorPK],
                chainSelector: "1",
                confirmations: 1,
                viemChain: localhostViemChain,
            },
            localhostPolygon: {
                name: "localhost",
                type: "localhost",
                id: 137,
                accounts: [operatorPK],
                chainSelector: "137",
                confirmations: 1,
                viemChain: localhostViemChain,
            },
        };
    }

    private filterNetworks(networkType: "mainnet" | "testnet" | "localhost"): ConceroNetwork[] {
        let networks: ConceroNetwork[] = [];
        const ignoredIds = globalConfig.IGNORED_NETWORK_IDS || [];

        switch (networkType) {
            case "localhost": {
                networks = Object.values(
                    this.getTestingNetworks(getEnvVar("OPERATOR_PRIVATE_KEY")),
                );
                break;
            }
            case "testnet": {
                networks = Object.values(this.testnetNetworks);
                break;
            }
            case "mainnet": {
                networks = Object.values(this.mainnetNetworks);
                break;
            }
        }

        return networks.filter(network => !ignoredIds.includes(network.id));
    }

    public dispose(): void {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        this.updateListeners = [];
    }
}

export const networkManager = NetworkManager.getInstance(
    require("./RpcManager").rpcManager,
    require("./DeploymentManager").deploymentsManager,
);
