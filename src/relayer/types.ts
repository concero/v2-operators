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
import { EventBusService, JobQueueService } from './services';
import { VerifierType } from './verifier';
import { PrismaClient } from '@prisma/client';

import { DeploymentManager, LogsListenerStore } from '../managers';
import { ParsedLog } from '../types';

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

/*
processing - log found & not requested confirmation
processing_request - verification request fetched & not responded yet
request_failed - verification request failed => need to be retried
processing_confirm - verification request succeeded => confirmation started
confirm_failed - verification confirm (messageSubmit) failed => need to be retried
success - message delivered
*/
export enum JobStatus {
    WaitingConfirmations = 'waiting_confirmations',
    ProcessingRequest = 'processing_request',
    RequestFailed = 'request_failed',
    ProcessingConfirm = 'processing_confirm',
    ConfirmFailed = 'confirm_failed',
    ProcessingTxFinality = 'processing_tx_finality',
    WaitingTxFinality = 'waiting_tx_finality',
    Success = 'success',
}
export type JobPayload = ParsedLog<MessageSentLogData> & {
    parsedReceipt: ParsedMessageLogReceipt;
    verifierType: VerifierType;
    expectedSrcBlockNumber?: bigint;
    expectedDstBlockNumber?: bigint;
    callbacks?: [];
};
