import { Address, Hex } from 'viem';

export type MessageSentLogData = {
    messageId: Hex;
    messageReceipt: Hex;
    validatorLibs: Address[];
    relayerLib: Address;
};
export type DecodedMessageSentReceipt = {
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

    relayerConfig: Hex;
    validatorConfigs: Hex[];
    internalValidatorConfigs: Hex[];
    payload: Hex;
};
