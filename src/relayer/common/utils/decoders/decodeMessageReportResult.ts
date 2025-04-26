import { decodeAbiParameters, hexToBytes } from "viem";
import { ByteArray } from "viem";
import { DecodedMessageReportResult } from "./types";

export function decodeMessageReportResult(resultBytes: ByteArray): DecodedMessageReportResult {
    try {
        const decodedClfResult = decodeAbiParameters(
            [
                {
                    type: "tuple",
                    name: "reportConfig",
                    components: [
                        { type: "uint8", name: "type" },
                        { type: "uint8", name: "payloadVersion" },
                        { type: "address", name: "requester" },
                    ],
                },
                { type: "bytes", name: "payload" },
            ],
            resultBytes,
        );

        // TODO: add versioning in the future

        const decodedPayload = decodeAbiParameters(
            [
                {
                    type: "tuple",
                    components: [
                        { type: "bytes32", name: "messageId" },
                        { type: "bytes32", name: "messageHash" },
                        { type: "bytes", name: "sender" },
                        { type: "uint24", name: "srcChainSelector" },
                        { type: "uint24", name: "dstChainSelector" },
                        {
                            type: "tuple",
                            name: "dstChainData",
                            components: [
                                { type: "address", name: "receiver" },
                                { type: "bytes", name: "data" },
                            ],
                        },
                        { type: "bytes[]", name: "allowedOperators" },
                    ],
                },
            ],
            hexToBytes(decodedClfResult[1]),
        );

        return {
            reportConfig: decodedClfResult[0],
            ...decodedPayload,
        };
    } catch (error) {
        console.error("Error decoding CLF message report response:", error);
        throw new Error("Failed to decode CLF message report response");
    }
}
