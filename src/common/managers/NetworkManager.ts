import { ConceroNetwork } from "../../types/ConceroNetwork";
import { NetworkManagerConfig } from "../../types/ManagerConfigs";
import { INetworkManager, NetworkUpdateListener } from "../../types/managers";
import { fetchNetworkConfigs } from "../utils";
import { getEnvVar, localhostViemChain, LoggerInterface } from "../utils/";

import { ManagerBase } from "./ManagerBase";

export class NetworkManager extends ManagerBase implements INetworkManager {
    private static instance: NetworkManager;

    private mainnetNetworks: Record<string, ConceroNetwork> = {};
    private testnetNetworks: Record<string, ConceroNetwork> = {};
    private allNetworks: Record<string, ConceroNetwork> = {};
    private activeNetworks: ConceroNetwork[] = [];
    private updateIntervalId: NodeJS.Timeout | null = null;

    private updateListeners: NetworkUpdateListener[] = [];
    private logger: LoggerInterface;
    private config: NetworkManagerConfig;

    private constructor(logger: LoggerInterface, config: NetworkManagerConfig) {
        super();
        this.config = config;
        this.logger = logger;
    }

    public static getInstance(): NetworkManager {
        return NetworkManager.instance;
    }

    public static createInstance(
        logger: LoggerInterface,
        config: NetworkManagerConfig,
    ): NetworkManager {
        this.instance = new NetworkManager(logger, config);
        return this.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.updateNetworks();
            this.setupUpdateCycle();
            this.initialized = true;
            this.logger.debug("Initialized");
        } catch (error) {
            this.logger.error("Failed to initialize networks:", error);
            throw error;
        }
    }

    public registerUpdateListener(listener: NetworkUpdateListener): void {
        const existingIndex = this.updateListeners.findIndex(
            existing => existing.constructor.name === listener.constructor.name,
        );

        if (existingIndex === -1) {
            this.updateListeners.push(listener);
        } else {
            this.logger.warn(`Update listener already registered: ${listener.constructor.name}`);
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

    public getNetworkById(chainId: number): ConceroNetwork {
        const network = Object.values(this.allNetworks).find(network => network.id === chainId);
        if (!network) {
            throw new Error(`Network with chain ID ${chainId} not found`);
        }
        return network;
    }

    public getNetworkByName(name: string): ConceroNetwork {
        const network = Object.values(this.allNetworks).find(network => network.name === name);
        if (!network) {
            throw new Error(`Network with name "${name}" not found`);
        }
        return network;
    }

    public getNetworkBySelector(selector: string): ConceroNetwork {
        const network = Object.values(this.allNetworks).find(
            network => network.chainSelector === selector,
        );
        if (!network) {
            throw new Error(`Network with selector "${selector}" not found`);
        }
        return network;
    }

    public getVerifierNetwork(): ConceroNetwork {
        if (this.config.networkMode === "mainnet") {
            return this.mainnetNetworks["arbitrum"];
        } else if (this.config.networkMode === "testnet") {
            return this.testnetNetworks["arbitrumSepolia"];
        } else if (this.config.networkMode === "localhost") {
            const localNetwork = this.testnetNetworks["localhost"];

            if (!localNetwork) {
                this.logger.error(
                    `Available testnet networks: ${Object.keys(this.testnetNetworks).join(", ")}`,
                );
                throw new Error("Localhost network not found in testnetNetworks");
            }

            this.logger.debug(
                `Using localhost network: ${localNetwork.name} (id: ${localNetwork.id})`,
            );
            return localNetwork;
        } else {
            throw new Error(`Unsupported network mode: ${this.config.networkMode}`);
        }
    }

    public async forceUpdate(): Promise<void> {
        await this.updateNetworks();
    }

    private setupUpdateCycle(): void {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }

        this.updateIntervalId = setInterval(
            () =>
                this.updateNetworks().catch(err =>
                    this.logger.error("Network update failed:", err),
                ),
            this.config.networkUpdateIntervalMs,
        );
    }

    private async updateNetworks(): Promise<void> {
        let networksFetched = false;
        try {
            const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

            if (this.config.networkMode === "localhost") {
                // In localhost mode, skip fetching remote network configs
                this.mainnetNetworks = {};
                const localhostNetworks = this.getTestingNetworks(operatorPK);
                this.testnetNetworks = localhostNetworks;
                this.logger.debug(
                    `Using localhost networks only: ${Object.keys(localhostNetworks).join(", ")}`,
                );
                networksFetched = true;
            } else {
                try {
                    const { mainnetNetworks: fetchedMainnet, testnetNetworks: fetchedTestnet } =
                        await fetchNetworkConfigs(this.config.networkMode);

                    const hasMainnetNetworks = Object.keys(fetchedMainnet).length > 0;
                    const hasTestnetNetworks = Object.keys(fetchedTestnet).length > 0;

                    if (hasMainnetNetworks) {
                        this.mainnetNetworks = this.createNetworkConfig(fetchedMainnet, "mainnet", [
                            operatorPK,
                        ]);
                    } else {
                        this.logger.warn(
                            "No mainnet networks fetched, keeping existing mainnet networks",
                        );
                    }

                    if (hasTestnetNetworks) {
                        this.testnetNetworks = this.createNetworkConfig(fetchedTestnet, "testnet", [
                            operatorPK,
                        ]);
                    } else {
                        this.logger.warn(
                            "No testnet networks fetched, keeping existing testnet networks",
                        );
                    }

                    networksFetched = true;
                } catch (error) {
                    this.logger.warn(
                        "Failed to fetch network configurations. Will retry on next update cycle:",
                        error,
                    );
                    if (Object.keys(this.allNetworks).length === 0) {
                        this.logger.error(
                            "No network configurations available. Unable to initialize services.",
                        );
                    }
                }
            }

            this.allNetworks = { ...this.testnetNetworks, ...this.mainnetNetworks };

            const filteredNetworks = this.filterNetworks(this.config.networkMode);

            if (networksFetched) {
                this.activeNetworks = filteredNetworks;
                this.logger.debug(
                    `Networks updated - Active networks: ${this.activeNetworks.length} (${this.activeNetworks.map(n => n.name).join(", ")})`,
                );
            }

            if (networksFetched) {
                await this.notifyListeners();
            }
        } catch (error) {
            this.logger.error("Failed to update networks:", error);
        }
    }

    private async notifyListeners(): Promise<void> {
        for (const listener of this.updateListeners) {
            try {
                await listener.onNetworksUpdated(this.activeNetworks);
            } catch (error) {
                this.logger.error("Error in network update listener:", error);
            }
        }
    }

    public async triggerInitialUpdates(): Promise<void> {
        this.logger.debug("Triggering initial updates for all listeners sequentially");

        for (const listener of this.updateListeners) {
            try {
                this.logger.debug(`Triggering initial update for ${listener.constructor.name}`);
                await listener.onNetworksUpdated(this.activeNetworks);
                this.logger.debug(`Completed initial update for ${listener.constructor.name}`);
            } catch (error) {
                this.logger.error(
                    `Error in initial update for ${listener.constructor.name}:`,
                    error,
                );
                throw error; // Fail fast if initial updates fail
            }
        }

        this.logger.debug("Completed all initial updates");
    }

    private createNetworkConfig<T extends string>(
        networks: Record<string, any>,
        networkType: "mainnet" | "testnet" | "localhost",
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
                        confirmations: this.config.defaultConfirmations,
                        viemChain: network.viemChain,
                    },
                ];
            }),
        ) as Record<T, ConceroNetwork>;
    }

    private getTestingNetworks(operatorPK: string): Record<string, ConceroNetwork> {
        return {
            localhost: {
                name: "localhost",
                type: "localhost",
                id: 1,
                accounts: [operatorPK],
                chainSelector: "1",
                confirmations: this.config.defaultConfirmations,
                viemChain: localhostViemChain,
            },
        };
    }

    private filterNetworks(networkType: "mainnet" | "testnet" | "localhost"): ConceroNetwork[] {
        let networks: ConceroNetwork[] = [];
        const ignoredIds = this.config.ignoredNetworkIds || [];
        const whitelistedIds = this.config.whitelistedNetworkIds[networkType] || [];

        switch (networkType) {
            case "localhost":
                networks = Object.values(
                    this.getTestingNetworks(getEnvVar("OPERATOR_PRIVATE_KEY")),
                );
                break;
            case "testnet":
                networks = Object.values(this.testnetNetworks);
                break;
            case "mainnet":
                networks = Object.values(this.mainnetNetworks);
                break;
        }

        networks = networks.filter(network => !ignoredIds.includes(network.id));

        if (whitelistedIds.length > 0) {
            networks = networks.filter(network => whitelistedIds.includes(network.id));
        }

        return networks;
    }

    public dispose(): void {
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
        }
        this.updateListeners = [];
        super.dispose();
    }
}
