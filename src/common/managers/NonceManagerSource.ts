import { Address, Client, createPublicClient } from "viem";
import { Singleton } from "./Singleton";

interface INonceManagerParams {
    address: Address;
    chainId: number;
}

interface IGetNonceManagerParams extends INonceManagerParams {
    client: Client;
}

export class NonceManagerSource extends Singleton {
    private noncesMap: Record<number, number> = {};

    protected constructor() {
        super();
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
