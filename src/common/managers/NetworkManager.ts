import { globalConfig } from "../../constants/globalConfig";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import {
    IDeploymentsManager,
    INetworkManager,
    IRpcManager,
    NetworkUpdateListener,
} from "../../types/managers";
import { fetchNetworkConfigs } from "../utils/fetchNetworkConfigs";
import { getEnvVar } from "../utils/getEnvVar";
import { localhostViemChain } from "../utils/localhostViemChain";
import { logger } from "../utils/logger";

import { ManagerBase } from "./ManagerBase";

export class NetworkManager extends ManagerBase implements INetworkManager {
    private static instance: NetworkManager;

    private mainnetNetworks: Record<string, ConceroNetwork> = {};
    private testnetNetworks: Record<string, ConceroNetwork> = {};
    private allNetworks: Record<string, ConceroNetwork> = {};
    private activeNetworks: ConceroNetwork[] = [];
    private updateIntervalId: NodeJS.Timeout | null = null;
    private rpcManager: IRpcManager | null = null;
    private deploymentsManager: IDeploymentsManager | null = null;
    private updateListeners: NetworkUpdateListener[] = [];

    private constructor(rpcManager?: IRpcManager, deploymentsManager?: IDeploymentsManager) {
        super();
        this.rpcManager = rpcManager || null;
        this.deploymentsManager = deploymentsManager || null;

        if (this.rpcManager && "onNetworksUpdated" in this.rpcManager) {
            this.registerUpdateListener(this.rpcManager as unknown as NetworkUpdateListener);
        }

        if (this.deploymentsManager && "onNetworksUpdated" in this.deploymentsManager) {
            this.registerUpdateListener(this.deploymentsManager as NetworkUpdateListener);
        }
    }

    public static getInstance(): NetworkManager {
        return NetworkManager.instance;
    }

    public static createInstance(
        rpcManager?: IRpcManager,
        deploymentsManager?: IDeploymentsManager,
    ): NetworkManager {
        this.instance = new NetworkManager(rpcManager, deploymentsManager);
        return this.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.updateNetworks();
            this.setupUpdateCycle();
            this.initialized = true;
            logger.debug("[NetworkManager]: Initialized successfully");
        } catch (error) {
            logger.error("[NetworkManager]: Failed to initialize networks:", error);
            throw error;
        }
    }

    public registerUpdateListener(listener: NetworkUpdateListener): void {
        const existingIndex = this.updateListeners.findIndex(
            existing => existing.constructor.name === listener.constructor.name,
        );

        if (existingIndex === -1) {
            this.updateListeners.push(listener);
            // logger.debug(
            //     `[NetworkManager]: Registered update listener: ${listener.constructor.name}`,
            // );
        } else {
            logger.warn(
                `[NetworkManager]: Update listener already registered: ${listener.constructor.name}`,
            );
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
        } else {
            throw new Error(`Unsupported network mode: ${globalConfig.NETWORK_MODE}`);
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
                    logger.error("[NetworkManager]: Network update failed:", err),
                ),
            globalConfig.NETWORK_MANAGER.NETWORK_UPDATE_INTERVAL_MS,
        );
    }

    private async updateNetworks(): Promise<void> {
        try {
            const { mainnetNetworks: fetchedMainnet, testnetNetworks: fetchedTestnet } =
                await fetchNetworkConfigs();
            const operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");

            this.mainnetNetworks = this.createNetworkConfig(fetchedMainnet, "mainnet", [
                operatorPK,
            ]);
            this.testnetNetworks = {
                ...this.createNetworkConfig(fetchedTestnet, "testnet", [operatorPK]),
            };
            this.allNetworks = { ...this.testnetNetworks, ...this.mainnetNetworks };
            this.activeNetworks = this.filterNetworks(
                globalConfig.NETWORK_MODE as "mainnet" | "testnet" | "localhost",
            );

            logger.debug(
                `[NetworkManager]: Networks updated - Active networks: ${this.activeNetworks.length}`,
            );
            this.notifyListeners();
        } catch (error) {
            logger.error("[NetworkManager]: Failed to update networks:", error);
            throw error;
        }
    }

    private notifyListeners(): void {
        for (const listener of this.updateListeners) {
            try {
                listener.onNetworksUpdated(this.activeNetworks);
            } catch (error) {
                logger.error("[NetworkManager]: Error in network update listener:", error);
            }
        }
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
                        confirmations: globalConfig.NETWORK_MANAGER.DEFAULT_BLOCK_CONFIRMATIONS,
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
                confirmations: globalConfig.NETWORK_MANAGER.DEFAULT_BLOCK_CONFIRMATIONS,
                viemChain: localhostViemChain,
            },
            localhostPolygon: {
                name: "localhost",
                type: "localhost",
                id: 137,
                accounts: [operatorPK],
                chainSelector: "137",
                confirmations: globalConfig.NETWORK_MANAGER.DEFAULT_BLOCK_CONFIRMATIONS,
                viemChain: localhostViemChain,
            },
        };
    }

    private filterNetworks(networkType: "mainnet" | "testnet" | "localhost"): ConceroNetwork[] {
        let networks: ConceroNetwork[] = [];
        const ignoredIds = globalConfig.IGNORED_NETWORK_IDS || [];
        const whitelistedIds =
            globalConfig.WHITELISTED_NETWORK_IDS[
                networkType as keyof typeof globalConfig.WHITELISTED_NETWORK_IDS
            ] || [];

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
