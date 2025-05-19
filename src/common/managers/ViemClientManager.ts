import { PublicClient, WalletClient, createPublicClient, createWalletClient, fallback } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts/types";

import { globalConfig } from "../../constants/globalConfig";
import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../types/managers";
import { createCustomHttpTransport } from "../utils/customHttpTransport";
import { getEnvVar } from "../utils/getEnvVar";
import { logger } from "../utils/logger";

import { ManagerBase } from "./ManagerBase";

export interface ViemClients {
    walletClient: WalletClient;
    publicClient: PublicClient;
    account: PrivateKeyAccount;
}

export class ViemClientManager
    extends ManagerBase
    implements RpcUpdateListener, NetworkUpdateListener
{
    private static instance: ViemClientManager;
    private clients: Map<string, ViemClients> = new Map();
    private rpcManager: IRpcManager;

    private constructor(rpcManager: IRpcManager) {
        super();
        this.rpcManager = rpcManager;
    }

    public static createInstance(rpcManager: IRpcManager): ViemClientManager {
        ViemClientManager.instance = new ViemClientManager(rpcManager);
        return ViemClientManager.instance;
    }
    public static getInstance(): ViemClientManager {
        if (!ViemClientManager.instance) {
            throw new Error("ViemClientManager is not initialized. Call createInstance() first.");
        }
        return ViemClientManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Register as RPC update listener
        this.rpcManager.registerRpcUpdateListener(this);
        await super.initialize();
        logger.debug("[ViemClientManager]: Initialized successfully");
    }

    private createTransport(chain: ConceroNetwork) {
        const rpcUrls = this.rpcManager.getRpcsForNetwork(chain.name);

        if (!rpcUrls || rpcUrls.length === 0) {
            throw new Error(`No RPC URLs available for chain ${chain.name}`);
        }

        return fallback(
            rpcUrls.map(url => createCustomHttpTransport(url)),
            globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS,
        );
    }

    private initializeClients(chain: ConceroNetwork): ViemClients {
        const privateKey = getEnvVar("OPERATOR_PRIVATE_KEY");
        const account = privateKeyToAccount(`0x${privateKey}`);
        const transport = this.createTransport(chain);

        const publicClient = createPublicClient({
            transport,
            chain: chain.viemChain,
            batch: { multicall: true },
        });
        const walletClient = createWalletClient({
            transport,
            chain: chain.viemChain,
            account,
        });

        return {
            publicClient,
            walletClient,
            account,
        };
    }

    public getClients(chain: ConceroNetwork): ViemClients {
        if (!this.initialized) {
            throw new Error("ViemClientManager not properly initialized");
        }

        const cachedClients = this.clients.get(chain.name);
        if (cachedClients) {
            return cachedClients;
        }

        const newClients = this.initializeClients(chain);
        this.clients.set(chain.name, newClients);

        return newClients;
    }

    public onRpcUrlsUpdated(networks: ConceroNetwork[]): void {
        this.resetClientsForNetworks(networks);
    }

    private resetClientsForNetworks(networks: ConceroNetwork[]): void {
        for (const network of networks) {
            try {
                this.clients.delete(network.name);
            } catch (error) {
                logger.error(
                    `[ViemClientManager]: Failed to update viem clients for ${network.name}:`,
                    error,
                );
            }
        }

        if (networks.length > 0) {
            logger.debug(
                `[ViemClientManager]: Viem clients reset for ${networks.map(n => n.name).join(", ")}`,
            );
        }
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        // We don't need to reset clients here as RpcManager will trigger onRpcUrlsUpdated
        // which will handle the client resets
    }

    public async updateClientsForNetworks(networks: ConceroNetwork[]): Promise<void> {
        for (const network of networks) {
            try {
                const newClients = this.initializeClients(network);
                this.clients.set(network.name, newClients);
                logger.debug(`[ViemClientManager]: Updated clients for chain ${network.name}`);
            } catch (error) {
                logger.error(
                    `[ViemClientManager]: Failed to update clients for chain ${network.name}`,
                    error,
                );
            }
        }
    }

    public override dispose(): void {
        if (this.rpcManager) {
            this.rpcManager.unregisterRpcUpdateListener(this);
        }
        this.clients.clear();
        super.dispose();
        ViemClientManager.instance = undefined as any;
        logger.debug("[ViemClientManager]: Disposed");
    }
}
