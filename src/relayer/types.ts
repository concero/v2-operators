import { Abi, AbiEvent, Address, Hash, Hex } from 'viem';
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
import { ParsedLog } from '../types';

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

export enum JobStatus {
    WaitingSrcConfirmation = 'waiting_src_confirmation', // wait for finalization / block confirmation proof on src
    ProcessingRequest = 'processing_request', // planned to be requested
    RequestFailed = 'request_failed', // planned request failed, should be retried
    ProcessingConfirm = 'processing_verify', // planned to be verified
    ConfirmFailed = 'confirm_failed', // planned verification failed, should be retried
    WaitingTxFinality = 'waiting_tx_finality', // planned to check finality on dst
    Success = 'success', // tx executed and on dst side
}
export type JobBlocksDelta = bigint | 'finalized';
export type JobPayload = Omit<
    ParsedLog<MessageSentLogData>,
    'eventName' | 'eventHash' | 'blockNumber' | 'transactionHash'
> & {
    parsedReceipt: ParsedMessageLogReceipt;
    callbacks?: [];
};

export namespace CRE {
    export type Request = {
        batch: Request.Item[];
    };
    export namespace Request {
        export type Item = {
            messageId: Hash;
            srcChainSelector: number;
            blockNumber: string;
        };
    }

    export type Response = { [messageId: string]: Response.Item };
    export namespace Response {
        export type Item = {
            rawReport: string;
            reportContext: string;
            signs: {
                signature: string;
                signerId: number;
            }[];
        };
    }
}
