import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../../types/managers";
import { logger } from "../utils/logger";
import { globalConfig } from "../../../constants/globalConfig";
import { httpQueue } from "../utils/httpClient";

export class RpcManager implements IRpcManager, NetworkUpdateListener {
    private static instance: RpcManager;

    private rpcUrls: Record<string, string[]> = {};
    private lastUpdateTime: Record<string, number> = {};
    private rpcUpdateListeners: RpcUpdateListener[] = [];
    private initialized: boolean = false;

    public static getInstance(): RpcManager {
        if (!RpcManager.instance) {
            RpcManager.instance = new RpcManager();
        }
        return RpcManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        this.initialized = true;
        logger.debug("RpcManager initialized successfully");
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
            if (chainType === "localhost") {
                const localhostUrl = process.env.LOCALHOST_RPC_URL;
                if (!localhostUrl) {
                    throw new Error("LOCALHOST_RPC_URL environment variable is not set");
                }
                return [localhostUrl];
            }

            const url = `${globalConfig.URLS.CONCERO_RPCS}${chainType}/${chainId}-${chainName}.json`;
            logger.debug(`Fetching RPC URLs for ${chainName} from ${url}`);

            const chainConfig = await httpQueue.get(url);

            logger.debug(`Raw response for ${chainName}:`, chainConfig);

            const response = await chainConfig;
            logger.debug(`Parsed response for ${chainName}:`, response);

            if (!response.urls || !Array.isArray(response.urls)) {
                throw new Error(`Invalid RPC URL response format for chain ${chainName}`);
            }

            return response.urls;
        } catch (error) {
            logger.error(`Error fetching RPC URLs for ${chainName}:`, error);
            throw error;
        }
    }

    public async updateRpcsForNetworks(networks: ConceroNetwork[]): Promise<void> {
        const now = Date.now();
        const updatePromises: Promise<void>[] = [];
        const updatedNetworks: ConceroNetwork[] = [];

        for (const network of networks) {
            updatePromises.push(
                this.updateRpcsForNetwork(network)
                    .then(() => {
                        updatedNetworks.push(network);
                    })
                    .catch(error => {
                        logger.error(`Failed to update RPC for network ${network.name}:`, error);
                    }),
            );
        }

        await Promise.allSettled(updatePromises);

        if (updatedNetworks.length > 0) {
            this.notifyRpcUpdateListeners(updatedNetworks);
        }
    }

    public async updateRpcsForNetwork(network: ConceroNetwork): Promise<void> {
        try {
            const urls = await this.fetchRpcUrls(network.id, network.name, network.type);

            if (urls.length > 0) {
                const previousUrls = this.rpcUrls[network.name] || [];
                this.rpcUrls[network.name] = urls;
                this.lastUpdateTime[network.name] = Date.now();
                logger.debug(`Updated RPC URLs for ${network.name}: ${urls.length} URLs available`);

                if (JSON.stringify(previousUrls) !== JSON.stringify(urls)) {
                    this.notifyRpcUpdateListeners([network]);
                }
            } else {
                logger.warn(`No RPC URLs found for chain ${network.name}`);
                this.rpcUrls[network.name] = [];
            }
        } catch (error) {
            logger.error(`Failed to update RPC URLs for chain ${network.name}:`, error);
            this.rpcUrls[network.name] = this.rpcUrls[network.name] || [];
            throw error;
        }
    }

    private notifyRpcUpdateListeners(networks: ConceroNetwork[]): void {
        for (const listener of this.rpcUpdateListeners) {
            try {
                listener.onRpcUrlsUpdated(networks);
            } catch (error) {
                logger.error("Error in RPC update listener:", error);
            }
        }
    }

    public getRpcsForNetwork(networkName: string): string[] {
        return this.rpcUrls[networkName] || [];
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        this.updateRpcsForNetworks(networks).catch(err =>
            logger.error("Failed to update RPCs after network update:", err),
        );
    }
}

export const rpcManager = RpcManager.getInstance();
