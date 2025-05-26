import { PublicClient } from "viem";

import { ConceroNetwork } from "../../types/ConceroNetwork";
import { IBlockManagerRegistry } from "../../types/managers/IBlockManagerRegistry";
import { NetworkUpdateListener } from "../../types/managers/NetworkUpdateListener";
import { Logger, LoggerInterface } from "../utils/logger";

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
    private logger: LoggerInterface;

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
        this.logger = Logger.getInstance().getLogger("BlockManagerRegistry");
    }

    public onNetworksUpdated(networks: ConceroNetwork[]): void {
        this.logger.info(`Networks updated, syncing BlockManagers for ${networks.length} networks`);
        this.updateBlockManagers(networks).catch(error => {
            this.logger.error("Failed to sync BlockManagers after network update", error);
        });
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
            // Ensure RPC URLs are available for this network
            await this.rpcManager.ensureRpcsForNetwork(network);

            // Get the client with the now-available RPC URLs
            const { publicClient } = this.viemClientManager.getClients(network);

            // Create the BlockManager
            const blockManager = await this.createBlockManager(network, publicClient);
            return blockManager;
        } catch (error) {
            this.logger.error(`Failed to create BlockManager for network ${network.name}`, error);
            throw error;
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

        // Create BlockManagers for new networks in parallel
        const newNetworks = networks.filter(network => !currentNetworkNames.has(network.name));
        if (newNetworks.length > 0) {
            this.logger.debug(`Creating ${newNetworks.length} new BlockManagers in parallel`);

            const results = await Promise.all(
                newNetworks.map(network => this.ensureBlockManagerForNetwork(network)),
            );
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
            this.logger.debug("Initialized");

            // Perform the initial sync of BlockManagers with active networks
            const activeNetworks = this.networkManager.getActiveNetworks();
            this.logger.debug(`Starting initial sync for ${activeNetworks.length} networks`);
            await this.updateBlockManagers(activeNetworks);
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
