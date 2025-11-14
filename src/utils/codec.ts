import { toHex } from 'viem';

function readUint24(data: Uint8Array, offset: number): number {
    return (data[offset] << 16) | (data[offset + 1] << 8) | data[offset + 2];
}

function readUint32(data: Uint8Array, offset: number): number {
    const dv = new DataView(data.buffer, data.byteOffset + offset, 4);
    return dv.getUint32(0, false);
}

function readUint64(data: Uint8Array, offset: number): bigint {
    const dv = new DataView(data.buffer, data.byteOffset + offset, 8);
    return dv.getBigUint64(0, false);
}

function readUint256(data: Uint8Array, offset: number): bigint {
    const dv = new DataView(data.buffer, data.byteOffset + offset + 24, 8);
    return dv.getBigUint64(0, false);
}

function sliceBytes(data: Uint8Array, start: number, end: number): Uint8Array {
    return data.slice(start, end);
}

// unflat, with returning nextOffset (for arrays)
function readFlatBytesAt(
    data: Uint8Array,
    start: number,
): { items: Uint8Array[]; nextOffset: number } {
    const count = readUint24(data, start);
    let offset = start + 3;

    const res: Uint8Array[] = [];
    for (let i = 0; i < count; i++) {
        const len = readUint24(data, offset);
        offset += 3;
        const item = sliceBytes(data, offset, offset + len);
        res.push(item);
        offset += len;
    }
    return { items: res, nextOffset: offset };
}

export type DecodedMessageReceipt = {
    version: number;
    srcChainSelector: number;
    dstChainSelector: number;
    nonce: bigint;

    msgSender: string;
    srcBlockConfirmations: bigint;

    dstChainData: Uint8Array;
    dstRelayerLib: Uint8Array;

    relayerConfig: Uint8Array;
    dstValidatorLibs: Uint8Array[];

    validatorConfigs: Uint8Array[];
    validationRpcs: Uint8Array[];
    deliveryRpcs: Uint8Array[];

    payload: Uint8Array;
};

export namespace MessagingCodec {
    export function decodeReceipt(receipt: Uint8Array): DecodedMessageReceipt {
        let offset = 0;

        // version (uint8)
        const version = receipt[offset];
        offset += 1;

        // srcChainSelector (uint24)
        const srcChainSelector = readUint24(receipt, offset);
        offset += 3;

        // dstChainSelector (uint24)
        const dstChainSelector = readUint24(receipt, offset);
        offset += 3;

        // nonce (uint256)
        const nonce = readUint256(receipt, offset);
        offset += 32;

        // src chain data
        const srcChainDataLength = readUint24(receipt, offset); // must be 28
        offset += 3;

        if (srcChainDataLength !== 28) {
            throw new Error('Unexpected EVM_SRC_CHAIN_DATA_LENGTH');
        }

        const msgSenderBytes = sliceBytes(receipt, offset, offset + 20);
        offset += 20;

        const srcBlockConfirmations = readUint64(receipt, offset);
        offset += 8;

        const msgSender = toHex(msgSenderBytes);

        // dstChainData
        const dstChainDataLength = readUint24(receipt, offset);
        offset += 3;

        const dstChainData = sliceBytes(receipt, offset, offset + dstChainDataLength);
        offset += dstChainDataLength;

        // dstRelayerLib
        const dstRelayerLibLength = readUint24(receipt, offset);
        offset += 3;

        const dstRelayerLib = sliceBytes(receipt, offset, offset + dstRelayerLibLength);
        offset += dstRelayerLibLength;

        // relayerConfig
        const relayerConfigLength = readUint24(receipt, offset);
        offset += 3;

        const relayerConfig = sliceBytes(receipt, offset, offset + relayerConfigLength);
        offset += relayerConfigLength;

        // dstValidatorLibs (bytes[])
        let r1 = readFlatBytesAt(receipt, offset);
        const dstValidatorLibs = r1.items;
        offset = r1.nextOffset;

        // validatorConfigs (bytes[])
        let r2 = readFlatBytesAt(receipt, offset);
        const validatorConfigs = r2.items;
        offset = r2.nextOffset;

        // validationRpcs (bytes[])
        let r3 = readFlatBytesAt(receipt, offset);
        const validationRpcs = r3.items;
        offset = r3.nextOffset;

        // deliveryRpcs (bytes[])
        let r4 = readFlatBytesAt(receipt, offset);
        const deliveryRpcs = r4.items;
        offset = r4.nextOffset;

        // payload
        const payloadLength = readUint24(receipt, offset);
        offset += 3;

        const payload = sliceBytes(receipt, offset, offset + payloadLength);
        offset += payloadLength;

        return {
            version,
            srcChainSelector,
            dstChainSelector,
            nonce,

            msgSender,
            srcBlockConfirmations,

            dstChainData,
            dstRelayerLib,

            relayerConfig,
            dstValidatorLibs,

            validatorConfigs,
            validationRpcs,
            deliveryRpcs,

            payload,
        };
    }
}
