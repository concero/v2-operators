import {
    ContractFunctionExecutionError,
    createPublicClient,
    createWalletClient,
    fallback,
    HttpRequestError,
    InvalidInputRpcError,
    MethodNotFoundRpcError,
    MethodNotSupportedRpcError,
    PublicClient,
    RpcRequestError,
    TimeoutError,
    TransactionNotFoundError,
    UnknownNodeError,
    UnknownRpcError,
    WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts/types";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { ViemClientManagerConfig } from "../../types/ManagerConfigs";
import { IRpcManager, NetworkUpdateListener, RpcUpdateListener } from "../../types/managers";
import { createCustomHttpTransport, getEnvVar, LoggerInterface } from "../utils";

import { ManagerBase } from "./ManagerBase";

export interface ViemClients {
    walletClient: WalletClient;
    publicClient: PublicClient;
    // TODO: do we really use this account? walletClient already has the account
    account: PrivateKeyAccount;
}
// Creates & updates Viem Fallback Clients for each network
export class ViemClientManager
    extends ManagerBase
    implements RpcUpdateListener, NetworkUpdateListener
{
    private static instance: ViemClientManager;
    private clients: Map<string, ViemClients> = new Map();
    private rpcManager: IRpcManager;
    private logger: LoggerInterface;

    private config: ViemClientManagerConfig;

    private constructor(
        logger: LoggerInterface,
        rpcManager: IRpcManager,
        config: ViemClientManagerConfig,
    ) {
        super();
        this.rpcManager = rpcManager;
        this.logger = logger;
        this.config = config;
    }

    public static createInstance(
        logger: LoggerInterface,
        rpcManager: IRpcManager,
        config: ViemClientManagerConfig,
    ): ViemClientManager {
        ViemClientManager.instance = new ViemClientManager(logger, rpcManager, config);
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
        this.logger.debug("Initialized");
    }

    private createTransport(chain: ConceroNetwork) {
        const rpcUrls = this.rpcManager.getRpcsForNetwork(chain.name);

        if (!rpcUrls || rpcUrls.length === 0) {
            throw new Error(`No RPC URLs available for chain ${chain.name}`);
        }

        return fallback(
            rpcUrls.map(url => createCustomHttpTransport(url)),
            {
                ...this.config.fallbackTransportOptions,
                shouldThrow: (error: Error) => {
                    if (
                        error instanceof HttpRequestError ||
                        error instanceof RpcRequestError ||
                        error instanceof TransactionNotFoundError ||
                        error instanceof UnknownRpcError ||
                        error instanceof UnknownNodeError ||
                        error instanceof InvalidInputRpcError ||
                        error instanceof MethodNotFoundRpcError ||
                        error instanceof TimeoutError ||
                        error instanceof MethodNotSupportedRpcError
                    ) {
                        return false;
                    } else if (error instanceof ContractFunctionExecutionError) {
                        if (
                            error.details.includes(
                                "the method eth_sendRawTransaction does not exist",
                            )
                        ) {
                            return false;
                        }
                    }

                    return true;
                },
            },
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

        if (!chain) {
            throw new Error("Cannot get clients: chain parameter is undefined or null");
        }

        if (!chain.name) {
            this.logger.error(`Invalid chain object provided: ${JSON.stringify(chain)}`);
            throw new Error("Cannot get clients: chain.name is missing");
        }

        const cachedClients = this.clients.get(chain.name);
        if (cachedClients) {
            return cachedClients;
        }

        this.logger.debug(`Creating new clients for chain: ${chain.name} (id: ${chain.id})`);
        const newClients = this.initializeClients(chain);
        this.clients.set(chain.name, newClients);

        return newClients;
    }

    // hook from RPCManager
    public onRpcUrlsUpdated(networks: ConceroNetwork[]): void {
        this.resetClientsForNetworks(networks);
    }

    // hook from NetworkManager
    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        // Networks updated, no action needed as clients are created on demand
    }

    private resetClientsForNetworks(networks: ConceroNetwork[]): void {
        for (const network of networks) {
            try {
                this.clients.delete(network.name);
            } catch (error) {
                this.logger.error(`Failed to update viem clients for ${network.name}:`, error);
            }
        }

        this.logger.debug(`Viem clients reset for ${networks.map(n => n.name).join(", ")}`);
    }

    public async updateClientsForNetworks(networks: ConceroNetwork[]): Promise<void> {
        for (const network of networks) {
            try {
                const newClients = this.initializeClients(network);
                this.clients.set(network.name, newClients);
                this.logger.debug(`Updated clients for chain ${network.name}`);
            } catch (error) {
                this.logger.error(`Failed to update clients for chain ${network.name}`, error);
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
        this.logger.debug("Disposed");
    }
}
