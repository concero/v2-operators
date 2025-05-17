import {
    createPublicClient,
    createWalletClient,
    fallback,
    nonceManager,
    PublicClient,
    TransactionNotFoundError,
    WalletClient,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts/types";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { IRpcManager, RpcUpdateListener } from "../../../types/managers";
import { globalConfig } from "../../../constants/globalConfig";

import { getEnvVar } from "../utils/getEnvVar";
import { logger } from "../utils/logger";
import { createCustomHttpTransport } from "./customHttpTransport";
import { HttpRequestError } from "viem";
import { RpcRequestError } from "viem";
import { UnknownRpcError } from "viem";
import { UnknownNodeError } from "viem";

export interface ViemClients {
    walletClient: WalletClient;
    publicClient: PublicClient;
    account: PrivateKeyAccount;
}

export class ViemClientManager implements RpcUpdateListener {
    private clients: Map<string, ViemClients> = new Map();
    private rpcManager: IRpcManager;
    private initialized: boolean = false;
    private static instance: ViemClientManager | null = null;

    private constructor(rpcManager: IRpcManager) {
        this.rpcManager = rpcManager;
    }

    public static getInstance(rpcManager: IRpcManager): ViemClientManager {
        if (!ViemClientManager.instance) {
            ViemClientManager.instance = new ViemClientManager(rpcManager);
        }

        return ViemClientManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        // Register as RPC update listener
        this.rpcManager.registerRpcUpdateListener(this);
        this.initialized = true;
        logger.debug("ViemClientManager initialized successfully");
    }

    private createTransport(chain: ConceroNetwork) {
        const rpcUrls = this.rpcManager.getRpcsForNetwork(chain.name);

        if (!rpcUrls || rpcUrls.length === 0) {
            throw new Error(`No RPC URLs available for chain ${chain.name}`);
        }

        return fallback(
            rpcUrls.map(url => createCustomHttpTransport(url)),
            {
                ...globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS,
                shouldThrow: (error: Error) => {
                    if (
                        error instanceof HttpRequestError ||
                        error instanceof RpcRequestError ||
                        error instanceof TransactionNotFoundError ||
                        error instanceof UnknownRpcError ||
                        error instanceof UnknownNodeError
                    ) {
                        return false;
                    }

                    return true;
                },
            },
        );
    }

    private initializeClients(chain: ConceroNetwork): ViemClients {
        const privateKey = getEnvVar("OPERATOR_PRIVATE_KEY");
        const account = privateKeyToAccount(`0x${privateKey}`, { nonceManager });
        const transport = this.createTransport(chain);

        const publicClient = createPublicClient({ transport, chain: chain.viemChain });
        const walletClient = createWalletClient({ transport, chain: chain.viemChain, account });

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
        for (const network of networks) {
            try {
                this.clients.delete(network.name);
            } catch (error) {
                logger.error(`Failed to update viem clients for ${network.name}:`, error);
            }
        }

        logger.debug(`Viem clients reset for ${networks.map(n => n.name).join(", ")}`);
    }

    public dispose(): void {
        if (this.rpcManager) {
            this.rpcManager.unregisterRpcUpdateListener(this);
        }
        this.clients.clear();
        this.initialized = false;
        ViemClientManager.instance = null;
    }
}

// Initialize the manager when importing this module
export const viemClientManager = (() => {
    try {
        const { rpcManager } = require("./RpcManager");
        return ViemClientManager.getInstance(rpcManager);
    } catch (error) {
        logger.warn("RpcManager not available, ViemClientManager will be initialized later");
        return null;
    }
})();
