import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, fallback, http } from "viem";
import type { PrivateKeyAccount } from "viem/accounts/types";
import { WalletClient } from "viem/clients/createWalletClient";
import { PublicClient } from "viem/clients/createPublicClient";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { activeNetworks } from "../../../constants";
import { fetchRpcUrls } from "./fetchers";
import { config } from "../../../constants/config";

type Clients = {
    walletClient: WalletClient;
    publicClient: PublicClient;
    account: PrivateKeyAccount;
    lastRotation: number;
};

class ViemClientManager {
    private clients: Map<string, Clients> = new Map();
    private rpcUrls: Record<string, string[]> = {};

    constructor() {
        this.setupUpdateLoop(activeNetworks);
    }

    private createTransport(chain: ConceroNetwork) {
        return fallback(
            this.rpcUrls[chain.name].map(url => http(url)),
            {
                rank: true,
                retryCount: 3,
                retryDelay: 1000,
            },
        );
    }

    private initializeClients(chain: ConceroNetwork): Clients {
        const privateKey = process.env.OPERATOR_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("OPERATOR_PRIVATE_KEY environment variable is not set");
        }

        const account = privateKeyToAccount(`0x${privateKey}`);
        const transport = this.createTransport(chain);

        const publicClient = createPublicClient({ transport, chain: chain.viemChain });
        const walletClient = createWalletClient({ transport, chain: chain.viemChain, account });

        if (!publicClient) {
            throw new Error(`Failed to create publicClient for chain: ${chain.name}`);
        }

        return {
            publicClient,
            walletClient,
            account,
            lastRotation: Date.now(),
        };
    }

    private rotateClients(chain: ConceroNetwork): Clients {
        const newClients = this.initializeClients(chain);
        this.clients.set(chain.name, newClients);
        return newClients;
    }

    private async getClients(chain: ConceroNetwork): Promise<Clients> {
        if (Object.keys(this.rpcUrls).length === 0) {
            await this.initializeRpcUrls(activeNetworks);
        }

        const cachedClients = this.clients.get(chain.name);

        if (cachedClients) {
            return cachedClients;
        }

        const newClients = this.initializeClients(chain);
        this.clients.set(chain.name, newClients);
        return newClients;
    }

    private rotateViemClients(chain: ConceroNetwork): void {
        setTimeout(() => {
            this.rotateClients(chain);
            console.log(`Clients rotated for chain: ${chain.name}`);
        }, 0);
    }

    private async updateRpcUrls(chains: ConceroNetwork[]): Promise<void> {
        for (const chain of chains) {
            try {
                const newUrls = await fetchRpcUrls(chain.viemChain.id);
                this.rpcUrls[chain.name] = newUrls;
                this.rotateViemClients(chain);
            } catch (error) {
                console.error(`Failed to update RPC URLs for chain: ${chain.name}`, error);
            }
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async setupUpdateLoop(chains: ConceroNetwork[]) {
        while (true) {
            try {
                await this.updateRpcUrls(chains);
            } catch (error) {
                console.error("Failed to update RPC URLs:", error);
            }
            await this.sleep(config.VIEM.CLIENT_ROTATION_INTERVAL_MS);
        }
    }

    private async initializeRpcUrls(chains: ConceroNetwork[]) {
        for (const chain of chains) {
            try {
                const urls = await fetchRpcUrls(chain.viemChain.id);
                this.rpcUrls[chain.name] = urls;
            } catch (error) {
                console.error(`Failed to initialize RPC URLs for chain: ${chain.name}`, error);
            }
        }
    }

    public async getFallbackClients(chain: ConceroNetwork): Promise<Clients> {
        const clients = await this.getClients(chain);
        return clients;
    }
}

const viemClientManager = new ViemClientManager();

export const getFallbackClients = (chain: ConceroNetwork): Promise<Clients> =>
    viemClientManager.getFallbackClients(chain);
