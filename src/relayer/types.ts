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

    msgSender: string;
    srcBlockConfirmations: bigint;

    dstChainData: Uint8Array;
    dstRelayerLib: Uint8Array;

    relayerConfig: Uint8Array;
    dstValidatorLibs: Uint8Array[];

    validatorConfigs: Uint8Array[];
    validationRpcs: Uint8Array[];
    deliveryRpcs: Uint8Array[];

    payload: Uint8Array;
};
