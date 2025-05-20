import { Address, Client, createPublicClient } from "viem";

import { ManagerBase } from "./ManagerBase";
import { Singleton } from "./Singleton";

interface INonceManagerParams {
    address: Address;
    chainId: number;
}

interface IGetNonceManagerParams extends INonceManagerParams {
    client: Client;
}

export class NonceManager extends ManagerBase {
    private static instance: NonceManager | null = null;
    private noncesMap: Record<number, number> = {};

    protected constructor() {
        super();
    }

    static createInstance(): NonceManager {
        if (!NonceManager.instance) {
            NonceManager.instance = new NonceManager();
        }
        return NonceManager.instance;
    }

    static getInstance(): NonceManager {
        if (!NonceManager.instance) {
            throw new Error(
                "NonceManager instance has not been created. Call createInstance() first.",
            );
        }
        return NonceManager.instance;
    }

    static dispose(): void {
        NonceManager.instance = null;
    }

    async get(parameters: IGetNonceManagerParams) {
        if (!this.noncesMap[parameters.chainId]) {
            const publicClient = createPublicClient({
                transport: () => parameters.client.transport,
                chain: parameters.client.chain,
            });

            const currentNonce = await publicClient.getTransactionCount({
                address: parameters.address,
            });

            this.set(parameters, currentNonce);
            return currentNonce;
        }

        return this.noncesMap[parameters.chainId];
    }

    async consume(parameters: IGetNonceManagerParams) {
        const nonce = await this.get(parameters);
        this.set(parameters, nonce + 1);
        return nonce;
    }

    reset(parameters: INonceManagerParams) {
        this.set(parameters, 0);
    }

    set(parameters: INonceManagerParams, nonce: number) {
        this.noncesMap[parameters.chainId] = nonce;
    }
}
