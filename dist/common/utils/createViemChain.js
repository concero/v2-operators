import { defineChain } from "viem/utils";
export function createViemChain(chainDefinition) {
    return defineChain({
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
