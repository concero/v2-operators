import { ConceroNetwork } from "../../types/ConceroNetwork";
import { RpcManagerConfig } from "../../types/ManagerConfigs";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../types/managers";
import { LoggerInterface } from "../utils/";
import { HttpClient } from "../utils/HttpClient";
import { ManagerBase } from "./ManagerBase";

// Watches @concero/rpcs and keeps an updatable list of RPC endpoints for networks
export class RpcManager extends ManagerBase implements IRpcManager, NetworkUpdateListener {
    private static instance: RpcManager;
    private httpClient: HttpClient;
    private logger: LoggerInterface;
    private config: RpcManagerConfig;

    constructor(logger: LoggerInterface, config: RpcManagerConfig) {
        super();
        this.httpClient = HttpClient.getInstance(logger, {
            retryDelay: 1000,
            maxRetries: 3,
            defaultTimeout: 10000,
        });
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(logger: LoggerInterface, config: RpcManagerConfig): RpcManager {
        RpcManager.instance = new RpcManager(logger, config);
        return RpcManager.instance;
    }

    private rpcUrls: Record<string, string[]> = {};
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
        if (!this.rpcUrls[network.name] || this.rpcUrls[network.name].length === 0) {
            await this.updateRpcs([network]);
        }
    }

    public async updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void> {
        await this.updateRpcs(networks);
    }

    public async updateRpcs(networks: ConceroNetwork[]): Promise<void> {
        try {
            const url = `${this.config.conceroRpcsUrl}/${this.config.networkMode}.json`;

            const response = await this.httpClient.get<Record<string, string[]>>(url);

            if (!response) {
                throw new Error("Failed to fetch RPC data");
            }

            this.rpcUrls = response;

            // Get list of networks that were updated
            const updatedNetworks: ConceroNetwork[] = Object.keys(response).map(
                networkName =>
                    ({
                        name: networkName,
                    }) as ConceroNetwork,
            );

            // Notify listeners
            this.notifyRpcUpdateListeners(updatedNetworks);

            this.logger.debug(`Updated RPCs for ${Object.keys(response).length} networks`);
        } catch (error) {
            this.logger.error("Failed to update RPCs:", error);
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
        this.updateRpcs(networks).catch(err =>
            this.logger.error("Failed to update RPCs after network update:", err),
        );
    }
}
