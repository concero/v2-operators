import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, fallback, http } from "viem";
import { urls } from "../constants";
export function getClients(viemChain, url) {
    var account = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : privateKeyToAccount("0x".concat(process.env.OPERATOR_PRIVATE_KEY));
    var publicClient = createPublicClient({
        transport: http(url),
        chain: viemChain
    });
    var walletClient = createWalletClient({
        transport: http(url),
        chain: viemChain,
        account: account
    });
    return {
        walletClient: walletClient,
        publicClient: publicClient,
        account: account
    };
}
export function getFallbackClients(chain) {
    var account = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : privateKeyToAccount("0x".concat(process.env.OPERATOR_PRIVATE_KEY));
    var viemChain = chain.viemChain, name = chain.name;
    var transport = fallback(urls[name].map(function(url) {
        return http(url);
    }));
    var publicClient = createPublicClient({
        transport: transport,
        chain: viemChain
    });
    var walletClient = createWalletClient({
        transport: transport,
        chain: viemChain,
        account: account
    });
    return {
        walletClient: walletClient,
        publicClient: publicClient,
        account: account
    };
}
