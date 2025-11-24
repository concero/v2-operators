import { Abi, AbiEvent, Address, Hex } from 'viem';
import {
    BlockManagerRegistry,
    HttpClient,
    Logger,
    NetworkManager,
    RpcManager,
    TxMonitor,
    TxReader,
    TxWriter,
    ViemClientManager,
} from '@concero/operator-utils';
import { EventBusService } from './services';
import { PrismaClient } from '@prisma/client';

import { LogsListenerStore, MessagingDeploymentManager } from '../managers';

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
    eventBus: EventBusService;
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
};

export type MessageSentLogData = {
    messageId: Hex;
    messageReceipt: Hex;
    validatorLibs: Address[];
    relayerLib: Address;
};
export type DecodedMessageLogReceipt = {
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
