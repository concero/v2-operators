import { PublicClient } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { BlockManagerRegistryConfig } from "../../types/ManagerConfigs";
import { IBlockManagerRegistry, NetworkUpdateListener } from "../../types/managers/";
import { LoggerInterface } from "../utils/";

import { IBlockCheckpointManager } from "../../types/managers";
import { BlockManager } from "./BlockManager";
import { ManagerBase } from "./ManagerBase";
import { NetworkManager } from "./NetworkManager";
import { RpcManager } from "./RpcManager";
import { ViemClientManager } from "./ViemClientManager";

export class BlockManagerRegistry
    extends ManagerBase
    implements IBlockManagerRegistry, NetworkUpdateListener
{
    private static instance: BlockManagerRegistry;
    private blockManagers: Map<string, BlockManager> = new Map();
    private blockCheckpointManager: IBlockCheckpointManager;
    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;
    private rpcManager: RpcManager;
    private logger: LoggerInterface;
    private config: BlockManagerRegistryConfig;

    private constructor(
        logger: LoggerInterface,
        blockCheckpointManager: IBlockCheckpointManager,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        rpcManager: RpcManager,
        config: BlockManagerRegistryConfig,
    ) {
        super();
        this.logger = logger;
        this.blockCheckpointManager = blockCheckpointManager;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.rpcManager = rpcManager;
        this.config = config;
    }

    public async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        this.logger.info(`Networks updated, syncing BlockManagers for ${networks.length} networks`);
        try {
            await this.updateBlockManagers(networks);
        } catch (error) {
            this.logger.error("Failed to sync BlockManagers after network update", error);
            throw error;
        }
    }

    private async ensureBlockManagerForNetwork(
        network: ConceroNetwork,
    ): Promise<BlockManager | null> {
        // If we already have a BlockManager for this network, return it
        if (this.blockManagers.has(network.name)) {
            this.logger.debug(`Using existing BlockManager for network ${network.name}`);
            return this.blockManagers.get(network.name)!;
        }

        try {
            const { publicClient } = this.viemClientManager.getClients(network);

            // Create the BlockManager
            const blockManager = await this.createBlockManager(network, publicClient);
            return blockManager;
        } catch (error) {
            this.logger.warn(`Failed to create BlockManager for network ${network.name}`, error);
            return null;
        }
    }

    private async updateBlockManagers(networks: ConceroNetwork[]): Promise<void> {
        if (!this.initialized) return;

        this.logger.info(`Syncing BlockManagers for ${networks.length} active networks`);
        const currentNetworkNames = new Set(this.blockManagers.keys());
        const newNetworkNames = new Set(networks.map(network => network.name));

        // Remove BlockManagers for networks that are no longer active
        for (const networkName of currentNetworkNames) {
            if (!newNetworkNames.has(networkName)) {
                this.logger.info(`Removing BlockManager for inactive network ${networkName}`);
                const blockManager = this.blockManagers.get(networkName);
                if (blockManager && "dispose" in blockManager) {
                    (blockManager as any).dispose();
                }
                this.blockManagers.delete(networkName);
            }
        }

        // Create BlockManagers for new networks
        const newNetworks = networks.filter(network => !currentNetworkNames.has(network.name));
        if (newNetworks.length > 0) {
            this.logger.debug(`Creating ${newNetworks.length} new BlockManagers`);

            const results = await Promise.all(
                newNetworks.map(network => this.ensureBlockManagerForNetwork(network)),
            );
        }
    }

    //TODO: attempt to refactor createInstance to a base class
    public static createInstance(
        logger: LoggerInterface,
        blockCheckpointManager: IBlockCheckpointManager,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        rpcManager: RpcManager,
        config: BlockManagerRegistryConfig,
    ): BlockManagerRegistry {
        BlockManagerRegistry.instance = new BlockManagerRegistry(
            logger,
            blockCheckpointManager,
            networkManager,
            viemClientManager,
            rpcManager,
            config,
        );
        return BlockManagerRegistry.instance;
    }

    public static getInstance(): BlockManagerRegistry {
        if (!BlockManagerRegistry.instance) {
            throw new Error(
                "BlockManagerRegistry is not initialized. Call createInstance() first.",
            );
        }
        return BlockManagerRegistry.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await super.initialize();
            this.logger.debug("Initialized");
        } catch (error) {
            this.logger.error("Failed to initialize", error);
            throw error;
        }
    }

    public async createBlockManager(
        network: ConceroNetwork,
        publicClient: PublicClient,
    ): Promise<BlockManager> {
        if (this.blockManagers.has(network.name)) {
            return this.blockManagers.get(network.name)!;
        }

        const blockManager = await BlockManager.create(
            network,
            publicClient,
            this.blockCheckpointManager,
            this.logger,
            {
                pollingIntervalMs: this.config.blockManagerConfig.pollingIntervalMs,
                catchupBatchSize: this.config.blockManagerConfig.catchupBatchSize,
                useCheckpoints: this.config.blockManagerConfig.useCheckpoints,
            },
        );

        this.blockManagers.set(network.name, blockManager);
        this.logger.debug(`Created BlockManager for network ${network.name}`);

        return blockManager;
    }

    public getBlockManager(networkName: string): BlockManager | undefined {
        if (this.blockManagers.has(networkName)) {
            return this.blockManagers.get(networkName)!;
        }

        this.logger.warn(`BlockManager for ${networkName} not found`);
        return null;
    }

    public getAllBlockManagers(): BlockManager[] {
        return Array.from(this.blockManagers.values());
    }

    public getAllManagedNetworks(): string[] {
        return Array.from(this.blockManagers.keys());
    }

    public async getLatestBlockForChain(networkName: string): Promise<bigint | null> {
        const blockManager = this.getBlockManager(networkName);
        if (!blockManager) {
            this.logger.error(`BlockManager for ${networkName} not found`);
            return null;
        }

        return blockManager.getLatestBlock();
    }

    public override dispose(): void {
        if (this.initialized) {
            this.networkManager.unregisterUpdateListener(this);

            // Properly dispose all block managers
            for (const [networkName, blockManager] of this.blockManagers.entries()) {
                if ("dispose" in blockManager) {
                    (blockManager as any).dispose();
                }
                this.logger.debug(`Disposed BlockManager for ${networkName}`);
            }

            this.blockManagers.clear();
            super.dispose();
            this.logger.debug("Disposed");
        }
    }
}
