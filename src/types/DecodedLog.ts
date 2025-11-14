import { Hex } from 'viem';

export type DecodedLog<Data = unknown> = {
    eventHash: Hex;
    eventName: string;
    data: Data;
    transactionHash: Hex;
    blockNumber: bigint;
};
