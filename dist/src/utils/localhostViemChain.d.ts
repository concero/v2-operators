export declare const localhostViemChain: {
    blockExplorers?: {
        [key: string]: {
            name: string;
            url: string;
            apiUrl?: string | undefined;
        };
        default: {
            name: string;
            url: string;
            apiUrl?: string | undefined;
        };
    } | undefined | undefined;
    blockTime?: number | undefined | undefined;
    contracts?: {
        [x: string]: import("viem").ChainContract | {
            [sourceId: number]: import("viem").ChainContract | undefined;
        } | undefined;
        ensRegistry?: import("viem").ChainContract | undefined;
        ensUniversalResolver?: import("viem").ChainContract | undefined;
        multicall3?: import("viem").ChainContract | undefined;
        universalSignatureVerifier?: import("viem").ChainContract | undefined;
    } | undefined;
    ensTlds?: readonly string[] | undefined;
    id: number;
    name: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    experimental_preconfirmationTime?: number | undefined | undefined;
    rpcUrls: {
        [key: string]: {
            http: readonly string[];
            webSocket?: readonly string[] | undefined;
        };
        default: {
            http: readonly string[];
            webSocket?: readonly string[] | undefined;
        };
    };
    sourceId?: number | undefined | undefined;
    testnet?: boolean | undefined | undefined;
    custom?: Record<string, unknown> | undefined;
    fees?: import("viem").ChainFees<import("viem").ChainFormatters | undefined> | undefined;
    formatters?: import("viem").ChainFormatters | undefined;
    serializers?: import("viem").ChainSerializers<import("viem").ChainFormatters, import("viem").TransactionSerializable> | undefined;
};
//# sourceMappingURL=localhostViemChain.d.ts.map