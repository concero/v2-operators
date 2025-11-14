import { EventEmitter } from 'node:events';
import { Abi, AbiEvent, Address } from 'viem';
import {
    BlockManagerRegistry,
    ConceroNetwork,
    Logger,
    NetworkManager,
    RpcManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { PrismaClient } from '@prisma/client';

import { LogsListenerStore, MessagingDeploymentManager } from '../managers';

export type Config = {
    contract: {
        router: Abi;
        verifier: Abi;
    };
    event: {
        messageSent: AbiEvent;
        messageReport: AbiEvent;
    };
};

export type Context = {
    logger: Logger;
    config: Config;
    eventEmitter: EventEmitter;
    network: NetworkManager;
    rpc: RpcManager;
    dbClient: PrismaClient;
    viemClient: ViemClientManager;
    blockRegistry: BlockManagerRegistry;
    messagingDeployment: MessagingDeploymentManager;
    logsListener: LogsListenerStore;
    txMonitor: TxMonitor;
    txReader: TxReader;
    txWriter: TxWriter;
    verifierNetwork: ConceroNetwork;
    verifierAddress: Address;
};
