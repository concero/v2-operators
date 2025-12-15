import { DecodedLog } from '../../../types';
import { DecodedMessageLogReceipt, MessageSentLogData } from '../../types';

export enum VerifierType {
    Empty = 'empty',
    CRE = 'cre',
}

export interface VerifierStrategy {
    requestVerification(payload: VerifierStrategy.Payload): Promise<void>;
    confirmVerification(payload: VerifierStrategy.Payload): Promise<void>;
}

export namespace VerifierStrategy {
    export type Payload = DecodedLog<MessageSentLogData> & {
        parsedReceipt: DecodedMessageLogReceipt;
        verifierType: VerifierType;
        expectedBlockNumber?: bigint;
        callbacks?: [];
    };
}
