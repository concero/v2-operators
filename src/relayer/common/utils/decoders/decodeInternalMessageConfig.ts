// Function to decode the internal message config
import { bitMasks, messageConfigBitOffsets } from "../../constants";

export type DecodedInternalMessageConfig = {
    version: number;
    srcChainSelector: number;
    dstChainSelector: number;
    minSrcConfirmations: number;
    minDstConfirmations: number;
    relayerConfig: number;
    isCallbackable: boolean;
};

export function decodeInternalMessageConfig(configBytes: string): DecodedInternalMessageConfig {
    // Convert bytes32 to BigInt for bitwise operations
    const configUint = BigInt(`0x${configBytes.slice(2)}`);

    return {
        version: Number((configUint >> messageConfigBitOffsets.OFFSET_VERSION) & bitMasks.MASK_8),
        srcChainSelector: Number(
            (configUint >> messageConfigBitOffsets.OFFSET_SRC_CHAIN) & bitMasks.MASK_24,
        ),
        dstChainSelector: Number(
            (configUint >> messageConfigBitOffsets.OFFSET_DST_CHAIN) & bitMasks.MASK_24,
        ),
        minSrcConfirmations: Number(
            (configUint >> messageConfigBitOffsets.OFFSET_MIN_SRC_CONF) & bitMasks.MASK_16,
        ),
        minDstConfirmations: Number(
            (configUint >> messageConfigBitOffsets.OFFSET_MIN_DST_CONF) & bitMasks.MASK_16,
        ),
        relayerConfig: Number(
            (configUint >> messageConfigBitOffsets.OFFSET_RELAYER_CONF) & bitMasks.MASK_8,
        ),
        isCallbackable:
            (configUint & (bitMasks.MASK_1 << messageConfigBitOffsets.OFFSET_CALLBACKABLE)) !== 0n,
    };
}
