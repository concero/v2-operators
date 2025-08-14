import { Address, PublicClient } from 'viem';

export interface INonceManagerParams {
    address: Address;
    chainId: number;
}

export interface IGetNonceParams extends INonceManagerParams {
    client: PublicClient;
}

export interface INonceManager {
    get(params: IGetNonceParams): Promise<number>;
    consume(params: IGetNonceParams): Promise<number>;
    reset(params: INonceManagerParams): void;
    set(params: INonceManagerParams, nonce: number): void;
    initialize(): Promise<void>;
    dispose(): void;
}
