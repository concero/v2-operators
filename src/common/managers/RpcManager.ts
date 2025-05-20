import { globalConfig } from "../../constants/globalConfig";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../types/managers";
import { httpQueue } from "../utils/httpClient";
import { logger } from "../utils/logger";

import { ManagerBase } from "./ManagerBase";

export class RpcManager extends ManagerBase implements IRpcManager, NetworkUpdateListener {
    private static instance: RpcManager;

    public static createInstance(): RpcManager {
        RpcManager.instance = new RpcManager();
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
        logger.debug("[RpcManager]: Initialized successfully");
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
            const rpcOverride = globalConfig.RPC.OVERRIDE[chainId.toString()];
            if (rpcOverride && rpcOverride.length) return rpcOverride;

            if (chainType === "localhost") {
                const localhostUrl = process.env.LOCALHOST_RPC_URL;
                if (!localhostUrl) {
                    throw new Error("LOCALHOST_RPC_URL environment variable is not set");
                }
                return [localhostUrl];
            }

            const url = `${globalConfig.URLS.CONCERO_RPCS}${chainType}/${chainId}-${chainName}.json`;
            // logger.debug(`[RpcManager]: Fetching RPC URLs for ${chainName} from ${url}`);

            const chainConfig = await httpQueue.get(url);
            const response = await chainConfig;

            const urls = response.urls;

            const rpcsExtension = globalConfig.RPC.EXTENSION[chainId.toString()];

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
            logger.error(`[RpcManager]: Error fetching RPC URLs for ${chainName}:`, error);
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
                        logger.error(
                            `[RpcManager]: Failed to update RPC for network ${network.name}:`,
                            error,
                        );
                    }),
            );
        }

        await Promise.allSettled(updatePromises);

        if (updatedNetworks.length > 0) {
            this.notifyRpcUpdateListeners(updatedNetworks);
        }
        logger.debug(
            `[RpcManager]: Updated RPC URLs for ${updatedNetworks.map(network => network.name).join(", ")}: ${updatedNetworks.length} networks updated`,
        );
    }

    public async updateRpcsForNetwork(network: ConceroNetwork): Promise<void> {
        try {
            const urls = await this.fetchRpcUrls(network.id, network.name, network.type);

            if (urls.length > 0) {
                const previousUrls = this.rpcUrls[network.name] || [];
                this.rpcUrls[network.name] = urls;
                this.lastUpdateTime[network.name] = Date.now();
                // logger.debug(
                //     `[RpcManager]: Updated RPC URLs for ${network.name}: ${urls.length} URLs available`,
                // );

                if (JSON.stringify(previousUrls) !== JSON.stringify(urls)) {
                    this.notifyRpcUpdateListeners([network]);
                }
            } else {
                logger.warn(`[RpcManager]: No RPC URLs found for chain ${network.name}`);
                this.rpcUrls[network.name] = [];
            }
        } catch (error) {
            logger.error(
                `[RpcManager]: Failed to update RPC URLs for chain ${network.name}:`,
                error,
            );
            this.rpcUrls[network.name] = this.rpcUrls[network.name] || [];
            throw error;
        }
    }

    private notifyRpcUpdateListeners(networks: ConceroNetwork[]): void {
        for (const listener of this.rpcUpdateListeners) {
            try {
                listener.onRpcUrlsUpdated(networks);
            } catch (error) {
                logger.error("[RpcManager]: Error in RPC update listener:", error);
            }
        }
    }

    public getRpcsForNetwork(networkName: string): string[] {
        return this.rpcUrls[networkName] || [];
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        this.updateRpcsForNetworks(networks).catch(err =>
            logger.error("[RpcManager]: Failed to update RPCs after network update:", err),
        );
    }
}
