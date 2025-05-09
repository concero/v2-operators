import {
    Address,
    Client,
    createPublicClient,
    NonceManagerSource as INonceManagerSource,
} from "viem";
import { Singleton } from "./Singleton";

export class NonceManagerSource extends Singleton implements INonceManagerSource {
    private noncesMap: Record<number, number> = {};

    protected constructor() {
        super();
    }

    async get(parameters: { address: Address; chainId: number } & { client: Client }) {
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

    set(parameters: { address: Address; chainId: number }, nonce: number) {
        this.noncesMap[parameters.chainId] = nonce;
    }
}
