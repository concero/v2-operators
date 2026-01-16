import { CRE } from './cre';
import { MessageSentLogData, ParsedMessageLogReceipt } from './message-sent-log';
import { ParsedLog } from './parsedLog';

export enum JobStatus {
    Reorged = 'reorged',
    WaitingSrcConfirmation = 'waiting_src_confirmation', // wait for finalization / block confirmation proof on src
    ProcessingRequest = 'processing_request', // planned to be requested
    RequestFailed = 'request_failed', // planned request failed, should be retried
    ProcessingConfirm = 'processing_verify', // planned to be verified
    WaitingTxFinality = 'waiting_tx_finality', // planned to check finality on dst
    Success = 'success', // tx executed and on dst side
}

export type JobBlocksDelta = bigint | 'finalized';
export type JobPayload = Omit<
    ParsedLog<MessageSentLogData>,
    'eventName' | 'eventHash' | 'blockNumber' | 'transactionHash'
> & {
    creResponse: CRE.Response;
    parsedReceipt: ParsedMessageLogReceipt;
};
