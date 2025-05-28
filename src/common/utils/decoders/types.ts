import { ByteArray } from "viem";
import { Hash } from "viem";
import { Address } from "viem";

export interface ReportConfig {
    type: number;
    payloadVersion: number;
    requester: Address;
}

export interface DecodedMessageReportResult {
    reportConfig: ReportConfig;
    messageId: Hash;
    messageHashSum: Hash;
    sender: ByteArray;
    srcChainSelector: number;
    dstChainSelector: number;
    dstChainData: {
        receiver: Address;
        gasLimit: bigint;
    };
    allowedOperators: ByteArray[];
}
