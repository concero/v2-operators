import { defineChain } from "viem";

export const astarShibuya = defineChain({
    id: 81,
    network: "astar-shibuya",
    name: "Astar Shibuya",
    nativeCurrency: { name: "SBY", symbol: "SBY", decimals: 18 },
    testnet: true,
    rpcUrls: {
        default: {
            http: ["https://evm.shibuya.astar.network"],
        },
    },
});
