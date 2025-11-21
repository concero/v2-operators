import { DecodedLog } from '../../types';
import { DecodedMessageLogReceipt, MessageSentLogData } from '../types';

export enum VerifierType {
    Empty = 'empty',
    CRE = 'cre',
}

export interface VerifierAdapter {
    requestVerification(payload: VerifierAdapter.Payload): Promise<void>;
}

export namespace VerifierAdapter {
    export type Payload = DecodedLog<
        MessageSentLogData & {
            parsedReceipt: DecodedMessageLogReceipt;
        }
    >;
}
