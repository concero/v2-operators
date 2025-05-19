const messageConfigBitSizes = {
    VERSION: 8n,
    CHAIN_SELECTOR: 24n,
    RESERVED: 32n,
    MIN_CONFIRMATIONS: 16n,
    RELAYER_CONF: 8n,
    CALLBACKABLE: 1n,
    UNUSED: 127n,
};

// Calculate offsets the same way Solidity does
const messageConfigBitOffsets = {
    OFFSET_VERSION: 256n - messageConfigBitSizes.VERSION, // 248
    get OFFSET_SRC_CHAIN() {
        return this.OFFSET_VERSION - messageConfigBitSizes.CHAIN_SELECTOR;
    }, // 224
    get OFFSET_DST_CHAIN() {
        return (
            this.OFFSET_SRC_CHAIN -
            (messageConfigBitSizes.RESERVED + messageConfigBitSizes.CHAIN_SELECTOR)
        );
    }, // 168
    get OFFSET_MIN_SRC_CONF() {
        return this.OFFSET_DST_CHAIN - messageConfigBitSizes.MIN_CONFIRMATIONS;
    }, // 152
    get OFFSET_MIN_DST_CONF() {
        return this.OFFSET_MIN_SRC_CONF - messageConfigBitSizes.MIN_CONFIRMATIONS;
    }, // 136
    get OFFSET_RELAYER_CONF() {
        return this.OFFSET_MIN_DST_CONF - messageConfigBitSizes.RELAYER_CONF;
    }, // 128
    get OFFSET_CALLBACKABLE() {
        return this.OFFSET_RELAYER_CONF - messageConfigBitSizes.CALLBACKABLE;
    }, // 127
};

export { messageConfigBitOffsets, messageConfigBitSizes };
