import {
    createPublicClient,
    createWalletClient,
    fallback,
    http,
    PublicClient,
    WalletClient,
} from "viem";

import { privateKeyToAccount } from "viem/accounts";
import type { PrivateKeyAccount } from "viem/accounts/types";
import { activeNetworks, globalConfig } from "../../../constants";
import { ConceroNetwork } from "../../../types/ConceroNetwork";
import { fetchRpcUrls } from "./fetchers";
import { getEnvVar } from "./getEnvVar";
import { logger } from "./logger";

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
            globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS,
        );
    }

    private initializeClients(chain: ConceroNetwork): Clients {
        const privateKey = getEnvVar("OPERATOR_PRIVATE_KEY");

        const account = privateKeyToAccount(`0x${privateKey}`);
        const transport = this.createTransport(chain);

        const publicClient = createPublicClient({ transport, chain: chain.viemChain });
        const walletClient = createWalletClient({ transport, chain: chain.viemChain, account });

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
            logger.debug(`Clients rotated for chain: ${chain.name}`);
        }, 0);
    }

    private async updateRpcUrls(chains: ConceroNetwork[]): Promise<void> {
        for (const chain of chains) {
            const newUrls = await fetchRpcUrls(chain.viemChain.id);
            this.rpcUrls[chain.name] = newUrls;
            this.rotateViemClients(chain);
        }
    }

    private sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async setupUpdateLoop(chains: ConceroNetwork[]) {
        while (true) {
            await this.updateRpcUrls(chains);
            await this.sleep(globalConfig.VIEM.CLIENT_ROTATION_INTERVAL_MS);
        }
    }

    private async initializeRpcUrls(chains: ConceroNetwork[]) {
        for (const chain of chains) {
            const urls = await fetchRpcUrls(chain.viemChain.id);
            this.rpcUrls[chain.name] = urls;
        }
    }

    public async getFallbackClients(chain: ConceroNetwork): Promise<Clients> {
        const clients = await this.getClients(chain);
        return clients;
    }
}

const viemClientManager = new ViemClientManager();

export async function getFallbackClients(chain: ConceroNetwork): Promise<Clients> {
    const clients = await viemClientManager.getFallbackClients(chain);
    return clients;
}
