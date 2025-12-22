import { JobPayload } from '../../types';

export enum ValidatorType {
    Empty = 'empty',
    CRE = 'cre',
}

export interface VerifierStrategy {
    requestVerification(payload: JobPayload): Promise<void>;
    confirmVerification(payload: JobPayload): Promise<void>;
}
