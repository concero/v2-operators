import { PublicClient } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IBlockManagerRegistry } from "../../types/managers/IBlockManagerRegistry";
import { NetworkUpdateListener } from "../../types/managers/NetworkUpdateListener";
import { logger } from "../utils/logger";

import { BlockCheckpointManager } from "./BlockCheckpointManager";
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
    private blockCheckpointManager: BlockCheckpointManager;
    private networkManager: NetworkManager;
    private viemClientManager: ViemClientManager;
    private rpcManager: RpcManager;

    private constructor(
        blockCheckpointManager: BlockCheckpointManager,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        rpcManager: RpcManager,
    ) {
        super();
        this.blockCheckpointManager = blockCheckpointManager;
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.rpcManager = rpcManager;
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        logger.info(
            `[BlockManagerService]: Networks updated, syncing BlockManagers for ${networks.length} networks`,
        );
        this.updateBlockManagers(networks).catch(error => {
            logger.error(
                "[BlockManagerRegistry]: Failed to sync BlockManagers after network update",
                error,
            );
        });
    }

    private async ensureBlockManagerForNetwork(
        network: ConceroNetwork,
    ): Promise<BlockManager | null> {
        // If we already have a BlockManager for this network, return it
        if (this.blockManagers.has(network.name)) {
            logger.debug(
                `[BlockManagerService]: Using existing BlockManager for network ${network.name}`,
            );
            return this.blockManagers.get(network.name)!;
        }

        try {
            // Ensure RPC URLs are available for this network
            await this.rpcManager.ensureRpcsForNetwork(network);

            // Get the client with the now-available RPC URLs
            const { publicClient } = this.viemClientManager.getClients(network);

            // Create the BlockManager
            const blockManager = await this.createBlockManager(network, publicClient);
            return blockManager;
        } catch (error) {
            logger.error(
                `[BlockManagerService]: Failed to create BlockManager for network ${network.name}`,
                error,
            );
            return null;
        }
    }

    private async updateBlockManagers(networks: ConceroNetwork[]): Promise<void> {
        if (!this.initialized) return;

        logger.info(
            `[BlockManagerService]: Syncing BlockManagers for ${networks.length} active networks`,
        );
        const currentNetworkNames = new Set(this.blockManagers.keys());
        const newNetworkNames = new Set(networks.map(network => network.name));

        // Remove BlockManagers for networks that are no longer active
        for (const networkName of currentNetworkNames) {
            if (!newNetworkNames.has(networkName)) {
                logger.info(
                    `[BlockManagerService]: Removing BlockManager for inactive network ${networkName}`,
                );
                const blockManager = this.blockManagers.get(networkName);
                if (blockManager && "dispose" in blockManager) {
                    (blockManager as any).dispose();
                }
                this.blockManagers.delete(networkName);
            }
        }

        // Create BlockManagers for new networks
        for (const network of networks) {
            if (!currentNetworkNames.has(network.name)) {
                await this.ensureBlockManagerForNetwork(network);
            }
        }
    }

    //TODO: attempt to refactor createInstance to a base class
    public static createInstance(
        blockCheckpointManager: BlockCheckpointManager,
        networkManager: NetworkManager,
        viemClientManager: ViemClientManager,
        rpcManager: RpcManager,
    ): BlockManagerRegistry {
        BlockManagerRegistry.instance = new BlockManagerRegistry(
            blockCheckpointManager,
            networkManager,
            viemClientManager,
            rpcManager,
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
            // Register as a network update listener
            this.networkManager.registerUpdateListener(this);

            await super.initialize();
            logger.debug("[BlockManagerRegistry]: Initialized successfully");

            // Perform the initial sync of BlockManagers with active networks
            const activeNetworks = this.networkManager.getActiveNetworks();
            logger.debug(
                `[BlockManagerService]: Starting initial sync for ${activeNetworks.length} networks`,
            );
            await this.updateBlockManagers(activeNetworks);
        } catch (error) {
            logger.error("[BlockManagerRegistry]: Failed to initialize", error);
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
        );

        this.blockManagers.set(network.name, blockManager);
        logger.info(`[BlockManagerService]: Created BlockManager for network ${network.name}`);

        return blockManager;
    }

    public async getBlockManager(networkName: string): Promise<BlockManager | null> {
        if (this.blockManagers.has(networkName)) {
            return this.blockManagers.get(networkName)!;
        }

        // Try to find the network and create a BlockManager for it
        const network = this.networkManager.getNetworkByName(networkName);
        if (network) {
            logger.debug(`[BlockManagerService]: Creating new BlockManager for ${networkName}`);
            return await this.ensureBlockManagerForNetwork(network);
        }

        logger.error(`[BlockManagerService]: Network ${networkName} not found`);
        return null;
    }

    public getAllBlockManagers(): BlockManager[] {
        return Array.from(this.blockManagers.values());
    }

    public getAllManagedNetworks(): string[] {
        return Array.from(this.blockManagers.keys());
    }

    public async getLatestBlockForChain(networkName: string): Promise<bigint | null> {
        const blockManager = await this.getBlockManager(networkName);
        if (!blockManager) {
            logger.error(`[BlockManagerService]: BlockManager for ${networkName} not found`);
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
                logger.debug(`[BlockManagerService]: Disposed BlockManager for ${networkName}`);
            }

            this.blockManagers.clear();
            super.dispose();
            logger.debug("[BlockManagerRegistry]: Disposed");
        }
    }
}
