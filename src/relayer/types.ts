import { Abi, AbiEvent, Address, Hex } from 'viem';
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

import { DeploymentManager, LogsListenerStore } from '../managers';

export enum ValidatorType {
    CRE = 'cre',
    Empty = 'empty',
}
export type Config = {
    contract: {
        router: Abi;
        verifier: Abi;
    };
    event: {
        messageSent: AbiEvent;
    };
};

export type Context = {
    logger: Logger;
    config: Config;
    http: HttpClient;
    network: ConceroNetworkManager;
    rpc: RpcManager;
    dbClient: PrismaClient;
    viemClient: ViemClientManager;
    blockRegistry: BlockManagerRegistry;
    deploymentManager: DeploymentManager;
    jobQueue: JobQueueService;
    logsListener: LogsListenerStore;
    txMonitor: TxMonitor;
    txReader: TxReader;
    txWriter: TxWriter;
};

export type MessageSentLogData = {
    messageId: Hex;
    messageReceipt: Hex;
    validatorLibs: Address[];
    relayerLib: Address;
};
export type ParsedMessageLogReceipt = {
    version: number;
    srcChainSelector: number;
    dstChainSelector: number;
    nonce: bigint;
    srcChainData: {
        sender: Address;
        blockConfirmations: bigint;
    };
    dstChainData: {
        raw: Hex;
        receiver: Address | null;
        gasLimit: number | null;
    };
    relayerLib: Hex;
    validatorLibs: Hex[];
    payload: Hex;
};

