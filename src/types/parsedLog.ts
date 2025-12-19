import { Hex } from 'viem';

export type ParsedLog<Data = unknown> = {
    eventHash: Hex;
    eventName: string;
    data: Data;
    transactionHash: Hex;
    blockNumber: bigint;
};
