import { Address, Hex } from 'viem';

export type MessageSentLogData = {
    messageId: Hex;
    messageReceipt: Hex;
    validatorLibs: Address[];
    relayerLib: Address;
};
export type ParsedMessageLogReceipt = {
    version: number;
    srcChainSelector: number;
    dstChainSelector: number;
    nonce: bigint;
    srcChainData: {
        sender: Address;
        blockConfirmations: bigint;
    };
    dstChainData: {
        raw: Hex;
        receiver: Address | null;
        gasLimit: number | null;
    };
    relayerLib: Hex;
    validatorLibs: Hex[];
    payload: Hex;
};
