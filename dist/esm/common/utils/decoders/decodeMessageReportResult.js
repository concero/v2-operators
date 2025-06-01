function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
import { decodeAbiParameters, hexToBytes } from "viem";
export function decodeMessageReportResult(resultBytes) {
    try {
        var decodedClfResult = decodeAbiParameters([
            {
                type: "tuple",
                name: "reportConfig",
                components: [
                    {
                        type: "uint8",
                        name: "type"
                    },
                    {
                        type: "uint8",
                        name: "payloadVersion"
                    },
                    {
                        type: "address",
                        name: "requester"
                    }
                ]
            },
            {
                type: "bytes",
                name: "payload"
            }
        ], resultBytes);
        // TODO: add versioning in the future
        var decodedPayload = decodeAbiParameters([
            {
                type: "tuple",
                components: [
                    {
                        type: "bytes32",
                        name: "messageId"
                    },
                    {
                        type: "bytes32",
                        name: "messageHashSum"
                    },
                    {
                        type: "bytes",
                        name: "sender"
                    },
                    {
                        type: "uint24",
                        name: "srcChainSelector"
                    },
                    {
                        type: "uint24",
                        name: "dstChainSelector"
                    },
                    {
                        type: "tuple",
                        name: "dstChainData",
                        components: [
                            {
                                type: "address",
                                name: "receiver"
                            },
                            {
                                type: "uint256",
                                name: "gasLimit"
                            }
                        ]
                    },
                    {
                        type: "bytes[]",
                        name: "allowedOperators"
                    }
                ]
            }
        ], hexToBytes(decodedClfResult[1]));
        return _object_spread({
            reportConfig: decodedClfResult[0]
        }, decodedPayload[0]);
    } catch (error) {
        console.error("Error decoding CLF message report response:", error);
        throw new Error("Failed to decode CLF message report response");
    }
}
