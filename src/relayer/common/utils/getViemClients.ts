import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, fallback, http } from "viem";
import type { PrivateKeyAccount } from "viem/accounts/types";
import { WalletClient } from "viem/clients/createWalletClient";
import { PublicClient } from "viem/clients/createPublicClient";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { activeNetworks, rpcUrls } from "../../../constants";
import { urls } from "../../../constants/urls";
import { fetchRpcUrls } from "./fetchers";

type Clients = {
    walletClient: WalletClient;
    publicClient: PublicClient;
    account: PrivateKeyAccount;
    lastRotation: number;
};

const rotationInterval = 1000 * 60 * 60; // 1 hour default

const createTransport = (chain: ConceroNetwork) =>
    fallback(
        rpcUrls[chain.name].map(url => http(url)),
        {
            rank: true,
            retryCount: 3,
            retryDelay: 1000,
        },
    );

const initializeClients = (chain: ConceroNetwork): Clients => {
    const account = privateKeyToAccount(`0x${process.env.OPERATOR_PRIVATE_KEY}`);
    const transport = createTransport(chain);

    return {
        publicClient: createPublicClient({ transport, chain: chain.viemChain }),
        walletClient: createWalletClient({ transport, chain: chain.viemChain, account }),
        account,
        lastRotation: Date.now(),
    };
};

const rotateClients = (clients: Map<string, Clients>, chain: ConceroNetwork): Clients => {
    const newClients = initializeClients(chain);
    clients.set(chain.name, newClients);
    return newClients;
};

const getClients = (clients: Map<string, Clients>, chain: ConceroNetwork): Clients => {
    const cachedClients = clients.get(chain.name);

    if (cachedClients) {
        return cachedClients;
    }

    const newClients = initializeClients(chain);
    clients.set(chain.name, newClients);
    return newClients;
};

const rotateViemClients = (clients: Map<string, Clients>, chain: ConceroNetwork): void => {
    setTimeout(() => {
        rotateClients(clients, chain);
        console.log(`Clients rotated for chain: ${chain.name}`);
    }, 0);
};

const updateRpcUrls = async (clients: Map<string, Clients>, chains: ConceroNetwork[]): Promise<void> => {
    for (const chain of chains) {
        try {
            const newUrls = await fetchRpcUrls(chain.viemChain.id);
            rpcUrls[chain.name] = newUrls;
            rotateViemClients(clients, chain);
            console.log(`RPC URLs updated and clients rotated for chain: ${chain.name}`);
        } catch (error) {
            console.error(`Failed to update RPC URLs for chain: ${chain.name}`, error);
        }
    }
};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const setupUpdateLoop = async (clients: Map<string, Clients>, chains: ConceroNetwork[]) => {
    while (true) {
        try {
            await updateRpcUrls(clients, chains);
        } catch (error) {
            console.error("Failed to update RPC URLs:", error);
        }
        await sleep(1000 * 60 * 60);
    }
};

const clients = new Map<string, Clients>();
setupUpdateLoop(clients, activeNetworks);

export const getFallbackClients = (chain: ConceroNetwork): Clients => getClients(clients, chain);
