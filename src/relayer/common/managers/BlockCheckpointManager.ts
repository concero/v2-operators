import fs from "fs/promises";
import path from "path";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { logger } from "../utils/logger";
import { Singleton } from "./Singleton";

interface BlockCheckpoint {
    networkName: string;
    chainId: number;
    lastProcessedBlock: string; // Using string to preserve BigInt precision
    timestamp: number;
}

export class BlockCheckpointManager extends Singleton {
    private checkpoints: Map<string, BlockCheckpoint> = new Map();
    private checkpointFilePath: string;
    private initialized: boolean = false;

    protected constructor() {
        super();
        // Ensure logs directory exists and set checkpoint file path
        this.checkpointFilePath = path.join(process.cwd(), "logs", "block-checkpoints.json");
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        await this.ensureLogsDirectoryExists();
        await this.loadCheckpoints();
        this.initialized = true;
        logger.debug("BlockCheckpointManager initialized successfully");
    }

    private async ensureLogsDirectoryExists(): Promise<void> {
        const logsDir = path.join(process.cwd(), "logs");
        try {
            await fs.mkdir(logsDir, { recursive: true });
        } catch (error) {
            logger.error("Failed to create logs directory:", error);
        }
    }

    public async loadCheckpoints(): Promise<void> {
        try {
            const data = await fs.readFile(this.checkpointFilePath, "utf8");
            const checkpoints: BlockCheckpoint[] = JSON.parse(data);

            checkpoints.forEach(checkpoint => {
                this.checkpoints.set(this.getNetworkKey(checkpoint.networkName), checkpoint);
            });

            logger.info(`Loaded block checkpoints for ${this.checkpoints.size} networks`);
        } catch (error) {
            if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
                logger.warn(`Could not load block checkpoints: ${error}`);
            }
        }
    }

    public async saveCheckpoints(): Promise<void> {
        try {
            const checkpointsArray = Array.from(this.checkpoints.values());
            await fs.writeFile(
                this.checkpointFilePath,
                JSON.stringify(checkpointsArray, null, 2),
                "utf8",
            );
            logger.info(`Saved block checkpoints for ${checkpointsArray.length} networks`);
        } catch (error) {
            logger.error("Failed to save block checkpoints:", error);
        }
    }

    public getLastProcessedBlock(network: ConceroNetwork): bigint | undefined {
        const key = this.getNetworkKey(network.name);
        const checkpoint = this.checkpoints.get(key);

        if (checkpoint) {
            return BigInt(checkpoint.lastProcessedBlock);
        }

        return undefined;
    }

    public updateLastProcessedBlock(network: ConceroNetwork, blockNumber: bigint): void {
        const key = this.getNetworkKey(network.name);

        this.checkpoints.set(key, {
            networkName: network.name,
            chainId: network.id,
            lastProcessedBlock: blockNumber.toString(),
            timestamp: Date.now(),
        });
    }

    private getNetworkKey(networkName: string): string {
        return networkName.toLowerCase();
    }
}

export const blockCheckpointManager = BlockCheckpointManager.getInstance();
