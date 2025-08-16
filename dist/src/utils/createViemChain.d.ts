import { defineChain } from 'viem/utils';
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
export declare function createViemChain(chainDefinition: ChainDefinition): ReturnType<typeof defineChain>;
//# sourceMappingURL=createViemChain.d.ts.map