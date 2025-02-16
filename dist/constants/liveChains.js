import chains from "./conceroNetworks";
export var conceroChains = [
    chains.baseSepolia,
    chains.arbitrumSepolia,
    chains.avalancheFuji
]; // export const liveChains: ConceroNetwork[] = [chains.polygon, chains.base, chains.arbitrum, chains.avalanche];
 //
 // export const conceroChains: ConceroChains = {
 //   testnet: {
 //     parentPool: [chains.baseSepolia],
 //     childPool: [chains.arbitrumSepolia, chains.avalancheFuji],
 //     infra: [chains.arbitrumSepolia, chains.avalancheFuji, chains.baseSepolia],
 //   },
 //   mainnet: {
 //     parentPool: [chains.base],
 //     childPool: [chains.polygon, chains.arbitrum, chains.avalanche],
 //     infra: [chains.polygon, chains.arbitrum, chains.avalanche, chains.base],
 //   },
 // };
 //
 // export const testnetChains: ConceroNetwork[] = Array.from(
 //   new Set([...conceroChains.testnet.parentPool, ...conceroChains.testnet.childPool, ...conceroChains.testnet.infra]),
 // );
 //
 // export const mainnetChains: ConceroNetwork[] = Array.from(
 //   new Set([...conceroChains.mainnet.parentPool, ...conceroChains.mainnet.childPool, ...conceroChains.mainnet.infra]),
 // );
