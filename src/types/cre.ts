import { Hex } from 'viem';

export namespace CRE {
    // @todo: decouple native CRE types & input for different methods
    export type Body<T> = {
        id: string;
        jsonrpc: '2.0';
        method: 'workflows.execute';
        params: {
            input: T;
            workflow: { workflowID: string };
        };
    };

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
