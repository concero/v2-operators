import { Address, Hex } from 'viem';

export enum VerifierType {
    Empty = 'empty',
    CRE = 'cre',
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
