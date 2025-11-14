import { Address, Hex } from 'viem';

export enum VerifierType {
    CRE = 'cre',
    CLF = 'clf',
}

export interface VerifierAdapter {
    requestMessageReport(payload: VerifierAdapter.Payload): Promise<void>;
}

export namespace VerifierAdapter {
    export type Payload = {
        chainName: string;
        chainSelector: string;
        messageId: Hex;
        sender: Address;
        blockNumber: bigint;
        data: string;
    };
}
