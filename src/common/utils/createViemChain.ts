import { defineChain } from "viem/utils";

export interface ChainDefinition {
    id: number;
    name: string;
    rpcUrls: string[];
    blockExplorer?: {
        name: string;
        url: string;
    };
    isTestnet: boolean;
}

export function createViemChain(chainDefinition: ChainDefinition): ReturnType<typeof defineChain> {
    return defineChain({
        id: chainDefinition.id,
        name: chainDefinition.name,
        nativeCurrency: {
            decimals: 18,
            name: "eth",
            symbol: "eth",
        },
        rpcUrls: {
            default: { http: chainDefinition.rpcUrls },
        },
        blockExplorers: chainDefinition.blockExplorer
            ? {
                  default: {
                      name: chainDefinition.blockExplorer.name,
                      url: chainDefinition.blockExplorer.url,
                  },
              }
            : undefined,
        testnet: chainDefinition.isTestnet,
    });
}
