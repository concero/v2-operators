import { ConceroNetwork } from "../../types/ConceroNetwork";
import { RpcManagerConfig } from "../../types/ManagerConfigs";
import { IRpcManager, NetworkUpdateListener } from "../../types/managers";
import { LoggerInterface } from "../utils/";
import { HttpClient } from "../utils/HttpClient";
import { ManagerBase } from "./ManagerBase";

// Watches @concero/rpcs and keeps an updatable list of RPC endpoints for networks
export class RpcManager extends ManagerBase implements IRpcManager, NetworkUpdateListener {
    private static instance: RpcManager;
    private httpClient: HttpClient;
    private logger: LoggerInterface;
    private config: RpcManagerConfig;
    private rpcUrls: Record<string, string[]> = {};

    constructor(logger: LoggerInterface, config: RpcManagerConfig) {
        super();
        this.httpClient = HttpClient.getInstance();
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(logger: LoggerInterface, config: RpcManagerConfig): RpcManager {
        RpcManager.instance = new RpcManager(logger, config);
        return RpcManager.instance;
    }

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

            const response =
                await this.httpClient.get<
                    Record<string, { rpcUrls: string[]; chainSelector: string | number }>
                >(url);

            if (!response) {
                throw new Error("Failed to fetch RPC data");
            }

            // Create a set of active network names for efficient lookup
            const activeNetworkNames = new Set(networks.map(n => n.name));

            // Remove RPCs for networks that are no longer active
            const currentNetworkNames = Object.keys(this.rpcUrls);
            for (const networkName of currentNetworkNames) {
                if (!activeNetworkNames.has(networkName)) {
                    delete this.rpcUrls[networkName];
                    this.logger.debug(`Removed RPCs for inactive network: ${networkName}`);
                }
            }

            // Only store RPCs for active networks
            const activeNetworkRpcs = Object.entries(response)
                .filter(([networkName]) => activeNetworkNames.has(networkName))
                .map(([networkName, data]) => [networkName, data.rpcUrls || []]);

            // Update RPCs for active networks
            for (const [networkName, rpcUrls] of activeNetworkRpcs) {
                this.rpcUrls[networkName] = rpcUrls as string[];
            }

            this.logger.debug(`Updated RPCs for ${activeNetworkRpcs.length} active networks`);
        } catch (error) {
            this.logger.error("Failed to update RPCs:", error);
            throw error;
        }
    }

    public getRpcsForNetwork(networkName: string): string[] {
        return this.rpcUrls[networkName] || [];
    }

    public async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        try {
            await this.updateRpcs(networks);
        } catch (err) {
            this.logger.error("Failed to update RPCs after network update:", err);
            throw err;
        }
    }
}
