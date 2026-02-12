import {
    BlockManagerRegistry,
    ConceroNetworkManager,
    HttpClient,
    Logger,
    RpcManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { JobQueueService } from './services';
import { PrismaClient } from '@prisma/client';

import { LogsListenerStore, RelayerBalanceManager } from '../managers';
import { ChainManager } from '../managers/chain-manager';
import { Config } from '../types';

export enum ValidatorType {
    CRE = 'cre',
    Empty = 'empty',
}

export type Context = {
    logger: Logger;
    config: Config;
    http: HttpClient;
    network: ConceroNetworkManager;
    rpc: RpcManager;
    dbClient: PrismaClient;
    viemClient: ViemClientManager;
    blockRegistry: BlockManagerRegistry;
    chainsManager: ChainManager;
    jobQueue: JobQueueService;
    logsListener: LogsListenerStore;
    txMonitor: TxMonitor;
    txReader: TxReader;
    txWriter: TxWriter;
    balanceManager: RelayerBalanceManager;
};
