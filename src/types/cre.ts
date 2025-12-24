import { Hash } from 'viem';

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
