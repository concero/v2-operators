import { ByteArray, decodeAbiParameters, hexToBytes } from "viem";

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
                        { type: "bytes32", name: "messageHashSum" },
                        { type: "bytes", name: "messageSender" },
                        { type: "uint24", name: "srcChainSelector" },
                        { type: "uint24", name: "dstChainSelector" },
                        { type: "uint256", name: "srcBlockNumber" },
                        {
                            type: "tuple",
                            name: "dstChainData",
                            components: [
                                { type: "address", name: "receiver" },
                                { type: "uint256", name: "gasLimit" },
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
            ...decodedPayload[0],
        };
    } catch (error) {
        console.error("Error decoding CLF message report response:", error);
        throw new Error("Failed to decode CLF message report response");
    }
}
