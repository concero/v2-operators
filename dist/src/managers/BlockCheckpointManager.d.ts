import { ManagerBase } from './ManagerBase';
import { LoggerInterface } from '@concero/operator-utils';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { BlockCheckpointManagerConfig } from '../types/ManagerConfigs';
import { IBlockCheckpointManager } from '../types/managers';
export declare class BlockCheckpointManager extends ManagerBase implements IBlockCheckpointManager {
    private static instance;
    private prisma;
    private logger;
    private config;
    private constructor();
    static createInstance(logger: LoggerInterface, config: BlockCheckpointManagerConfig): BlockCheckpointManager;
    static getInstance(): BlockCheckpointManager;
    getCheckpoint(network: ConceroNetwork): Promise<bigint | undefined>;
    updateLastProcessedBlock(networkName: string, blockNumber: bigint): Promise<void>;
    initialize(): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=BlockCheckpointManager.d.ts.map