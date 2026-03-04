import { DecodedMessageSentReceipt, MessageSentLogData } from './message-sent-log';
import { ParsedLog } from './parsedLog';

export enum JobStatus {
    Reorged = 'reorged',
    WaitingSrcConfirmation = 'waiting_src_confirmation', // wait for finalization / block confirmation proof on src
    PendingVerification = 'pending_verification', // verification planned, pending request
    FailedVerification = 'failed_verification', // verification failed, should be retried
    PendingSubmit = 'pending_submit', // tx submit planned, pending request
    ProcessingSubmit = 'processing_submit', // tx submit is processing (waiting for receipt)
    WaitingDstFinality = 'waiting_dst_finality', // wait for finalization proof on dst
    Success = 'success', // tx executed and on dst side
    Failed = 'failed', // failed by reason JobErrorCode
}

export enum JobErrorCode {
    ChainFinalityTagNotEnabled = 'chain_finality_tag_not_enabled',
}

export type JobPayload = Omit<
    ParsedLog<MessageSentLogData>,
    'eventName' | 'eventHash' | 'blockNumber' | 'transactionHash'
> & {
    parsedReceipt: DecodedMessageSentReceipt;
};
