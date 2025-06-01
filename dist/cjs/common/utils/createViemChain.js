"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createViemChain", {
    enumerable: true,
    get: function() {
        return createViemChain;
    }
});
var _utils = require("viem/utils");
function createViemChain(chainDefinition) {
    return (0, _utils.defineChain)({
        id: chainDefinition.id,
        name: chainDefinition.name,
        nativeCurrency: {
            decimals: 18,
            name: "eth",
            symbol: "eth"
        },
        rpcUrls: {
            default: {
                http: chainDefinition.rpcUrls
            }
        },
        blockExplorers: chainDefinition.blockExplorer ? {
            default: {
                name: chainDefinition.blockExplorer.name,
                url: chainDefinition.blockExplorer.url
            }
        } : undefined,
        testnet: chainDefinition.isTestnet
    });
}
