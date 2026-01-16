import { Hex } from 'viem';

export namespace CRE {
    export type MessageId = Hex;
    export type Proofs = Hex[]; // bytes32[]

    export type Request = {
        batch: Request.Item[];
    };
    export namespace Request {
        export type Item = {
            messageId: MessageId;
            srcChainSelector: number;
            blockNumber: string;
        };
    }

    export type Response = {
        report: Response.Report;
        proofs: Record<MessageId, Proofs>;
    };
    export namespace Response {
        export interface Report {
            rawReport: Hex;
            reportContext: Hex;
            signs: {
                signature: string;
                signerId: number;
            }[];
        }
    }
}
