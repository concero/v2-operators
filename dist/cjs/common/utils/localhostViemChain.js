"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "localhostViemChain", {
    enumerable: true,
    get: function() {
        return localhostViemChain;
    }
});
var _viem = require("viem");
var localhostViemChain = (0, _viem.defineChain)({
    id: 1,
    name: "localhost",
    nativeCurrency: {
        decimals: 18,
        name: "eth",
        symbol: "eth"
    },
    rpcUrls: {
        default: {
            http: [
                process.env.LOCALHOST_RPC_URL
            ]
        }
    },
    blockExplorers: [
        {
            name: "localhost",
            url: process.env.LOCALHOST_RPC_URL
        }
    ],
    testnet: true
});
