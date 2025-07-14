import { ConceroNetwork } from "../../types/ConceroNetwork";
import { RpcManagerConfig } from "../../types/config/ManagerConfigs";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../types/managers";
import { LoggerInterface } from "../utils/";
import { HttpClient } from "../utils/httpClient";

import { ManagerBase } from "./ManagerBase";

// Watches @concero/rpcs and keeps an updatable list of RPC endpoints for networks
export class RpcManager extends ManagerBase implements IRpcManager, NetworkUpdateListener {
    private static instance: RpcManager;
    private httpClient: HttpClient;
    private logger: LoggerInterface;
    private config: RpcManagerConfig;

    constructor(logger: LoggerInterface, config: RpcManagerConfig) {
        super();
        this.httpClient = HttpClient.getQueueInstance();
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(logger: LoggerInterface, config: RpcManagerConfig): RpcManager {
        RpcManager.instance = new RpcManager(logger, config);
        return RpcManager.instance;
    }

    private rpcUrls: Record<string, string[]> = {};
    private lastUpdateTime: Record<string, number> = {};
    private rpcUpdateListeners: RpcUpdateListener[] = [];

    public static getInstance(): RpcManager {
        if (!RpcManager.instance) {
            throw new Error("RpcManager is not initialized. Call createInstance() first.");
        }
        return RpcManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await super.initialize();
        this.logger.debug("Initialized");
    }

    public registerRpcUpdateListener(listener: RpcUpdateListener): void {
        if (!this.rpcUpdateListeners.includes(listener)) {
            this.rpcUpdateListeners.push(listener);
        }
    }

    public unregisterRpcUpdateListener(listener: RpcUpdateListener): void {
        const index = this.rpcUpdateListeners.indexOf(listener);
        if (index !== -1) {
            this.rpcUpdateListeners.splice(index, 1);
        }
    }

    public async ensureRpcsForNetwork(network: ConceroNetwork): Promise<void> {
        const now = Date.now();
        const lastUpdate = this.lastUpdateTime[network.name] || 0;

        if (!this.rpcUrls[network.name] || this.rpcUrls[network.name].length === 0) {
            await this.updateRpcsForNetwork(network);
        }
    }

    public async fetchRpcUrls(
        chainId: number,
        chainName: string,
        chainType: "mainnet" | "testnet" | "localhost",
    ): Promise<string[]> {
        try {
            const rpcOverride = this.config.rpcOverrides[chainId.toString()];
            if (rpcOverride && rpcOverride.length) return rpcOverride;

            if (chainType === "localhost") {
                const localhostUrl = process.env.LOCALHOST_RPC_URL;
                if (!localhostUrl) {
                    throw new Error("LOCALHOST_RPC_URL environment variable is not set");
                }
                return [localhostUrl];
            }

            const url = `${this.config.conceroRpcsUrl}${chainType}/${chainId}-${chainName}.json`;
            // this.logger.debug(`Fetching RPC URLs for ${chainName} from ${url}`);

            const chainConfig = await this.httpClient.get(url);
            const response = await chainConfig;

            const urls = response.urls;

            const rpcsExtension = this.config.rpcExtensions[chainId.toString()];

            if (rpcsExtension) {
                rpcsExtension.forEach((url: string) => {
                    urls.push(url);
                });
            }

            if (!urls) {
                throw new Error(`Invalid RPC URL response format for chain ${chainName}`);
            }

            return urls;
        } catch (error) {
            this.logger.error(`Error fetching RPC URLs for ${chainName}:`, error);
            throw error;
        }
    }

    public async updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void> {
        const updatePromises: Promise<void>[] = [];
        const updatedNetworks: ConceroNetwork[] = [];

        for (const network of networks) {
            updatePromises.push(
                this.updateRpcsForNetwork(network)
                    .then(() => {
                        updatedNetworks.push(network);
                    })
                    .catch(error => {
                        this.logger.error(
                            `Failed to update RPC for network ${network.name}:`,
                            error,
                        );
                    }),
            );
        }

        await Promise.allSettled(updatePromises);

        if (updatedNetworks.length > 0) {
            this.notifyRpcUpdateListeners(updatedNetworks);
        }
        this.logger.debug(
            `Updated RPC URLs for ${updatedNetworks.map(network => network.name).join(", ")}: ${updatedNetworks.length} networks updated`,
        );
    }

    public async updateRpcsForNetwork(network: ConceroNetwork): Promise<void> {
        try {
            const urls = await this.fetchRpcUrls(network.id, network.name, network.type);

            if (urls.length > 0) {
                const previousUrls = this.rpcUrls[network.name] || [];
                this.rpcUrls[network.name] = urls;
                this.lastUpdateTime[network.name] = Date.now();
                // this.logger.debug(
                //     `Updated RPC URLs for ${network.name}: ${urls.length} URLs available`,
                // );

                if (JSON.stringify(previousUrls) !== JSON.stringify(urls)) {
                    this.notifyRpcUpdateListeners([network]);
                }
            } else {
                this.logger.warn(`No RPC URLs found for chain ${network.name}`);
                this.rpcUrls[network.name] = [];
            }
        } catch (error) {
            this.logger.error(`Failed to update RPC URLs for chain ${network.name}:`, error);
            this.rpcUrls[network.name] = this.rpcUrls[network.name] || [];
            throw error;
        }
    }

    private notifyRpcUpdateListeners(networks: ConceroNetwork[]): void {
        for (const listener of this.rpcUpdateListeners) {
            try {
                listener.onRpcUrlsUpdated(networks);
            } catch (error) {
                this.logger.error("Error in RPC update listener:", error);
            }
        }
    }

    public getRpcsForNetwork(networkName: string): string[] {
        return this.rpcUrls[networkName] || [];
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        this.updateRpcsForNetworks(networks).catch(err =>
            this.logger.error("Failed to update RPCs after network update:", err),
        );
    }
}
