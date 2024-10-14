const conceroInfraAbi = [
    // {
    //     type: "event",
    //     name: "UnconfirmedTXSent",
    //     inputs: [
    //         { name: "ccipMessageId", type: "bytes32", indexed: true },
    //         { name: "sender", type: "address", indexed: false },
    //         { name: "recipient", type: "address", indexed: false },
    //         { name: "amount", type: "uint256", indexed: false },
    //         { name: "token", type: "uint8", indexed: false },
    //         { name: "dstChainSelector", type: "uint64", indexed: false },
    //     ],
    // },
    // {
    //     type: "event",
    //     name: "UnconfirmedTXAdded",
    //     inputs: [
    //         { name: "ccipMessageId", type: "bytes32", indexed: true },
    //         { name: "sender", type: "address", indexed: false },
    //         { name: "recipient", type: "address", indexed: false },
    //         { name: "amount", type: "uint256", indexed: false },
    //         { name: "token", type: "uint8", indexed: false },
    //         { name: "srcChainSelector", type: "uint64", indexed: false },
    //     ],
    // },
    // {
    //     type: "event",
    //     name: "TXReleased",
    //     inputs: [
    //         { name: "ccipMessageId", type: "bytes32", indexed: true },
    //         { name: "sender", type: "address", indexed: true },
    //         { name: "recipient", type: "address", indexed: true },
    //         { name: "token", type: "address", indexed: false },
    //         { name: "amount", type: "uint256", indexed: false },
    //     ],
    // },
    // {
    //     type: "event",
    //     name: "TXConfirmed",
    //     inputs: [
    //         { name: "ccipMessageId", type: "bytes32", indexed: true },
    //         { name: "sender", type: "address", indexed: true },
    //         { name: "recipient", type: "address", indexed: true },
    //         { name: "amount", type: "uint256", indexed: false },
    //         { name: "token", type: "uint8", indexed: false },
    //     ],
    // },
    {
        type: "event",
        name: "CCIPSent",
        inputs: [
            { name: "ccipMessageId", type: "bytes32", indexed: true },
            { name: "sender", type: "address", indexed: false },
            { name: "recipient", type: "address", indexed: false },
            { name: "token", type: "uint8", indexed: false }, // Assuming CCIPToken is uint8
            { name: "amount", type: "uint256", indexed: false },
            { name: "dstChainSelector", type: "uint64", indexed: false },
        ],
    },
];

export default conceroInfraAbi;
