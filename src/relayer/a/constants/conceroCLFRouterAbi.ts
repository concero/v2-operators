import { Abi } from "viem";

const conceroCLFRouterAbi: Abi = [
    {
        type: "event",
        name: "ConceroMessageSent",
        inputs: [
            { name: "id", type: "bytes32", indexed: true },
            {
                name: "message",
                type: "tuple",
                components: [
                    { name: "srcChainSelector", type: "uint64" },
                    { name: "dstChainSelector", type: "uint64" },
                    { name: "receiver", type: "address" },
                    { name: "sender", type: "address" },
                    {
                        name: "tokenAmounts",
                        type: "tuple",
                        components: [
                            { name: "token", type: "address" },
                            { name: "amount", type: "uint256" },
                        ],
                    },
                    { name: "relayers", type: "uint8[]" },
                    { name: "data", type: "bytes" },
                    { name: "extraArgs", type: "bytes" },
                ],
            },
        ],
    },
];

export default conceroCLFRouterAbi;
