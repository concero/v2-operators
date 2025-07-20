import { Mutex } from "async-mutex";

import { NonceManagerConfig } from "../../types/ManagerConfigs";
import { IGetNonceParams, INonceManager, INonceManagerParams } from "../../types/managers";
import { LoggerInterface } from "../utils/Logger";
import { ManagerBase } from "./ManagerBase";

export class NonceManager extends ManagerBase implements INonceManager {
    private static instance: NonceManager | null = null;
    private noncesMap: Record<number, number> = {};
    private mutexMap: Record<number, Mutex> = {};
    private logger: LoggerInterface;
    private config: NonceManagerConfig;

    protected constructor(logger: LoggerInterface, config: NonceManagerConfig) {
        super();
        this.logger = logger;
        this.config = config;
    }

    static createInstance(logger: LoggerInterface, config: NonceManagerConfig): NonceManager {
        if (!NonceManager.instance) {
            NonceManager.instance = new NonceManager(logger, config);
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

    async get(params: IGetNonceParams) {
        const m = this.getMutex(params.chainId);
        return m.runExclusive(async () => {
            if (!this.noncesMap[params.chainId]) {
                const actualNonce = await this.fetchNonce(params);
                this.set(params, actualNonce);
                return actualNonce;
            }
            return this.noncesMap[params.chainId];
        });
    }

    async consume(params: IGetNonceParams) {
        const m = this.getMutex(params.chainId);
        return m.runExclusive(async () => {
            const nonce = this.noncesMap[params.chainId]
                ? this.noncesMap[params.chainId]
                : await this.fetchNonce(params);

            this.set(params, nonce + 1);
            return nonce;
        });
    }

    reset(params: INonceManagerParams) {
        this.set(params, 0);
    }

    set(params: INonceManagerParams, nonce: number) {
        this.noncesMap[params.chainId] = nonce;
    }

    private async fetchNonce(params: IGetNonceParams) {
        return await params.client.getTransactionCount({ address: params.address });
    }

    private getMutex(chainId: number): Mutex {
        if (!this.mutexMap[chainId]) {
            this.mutexMap[chainId] = new Mutex();
        }
        return this.mutexMap[chainId];
    }
}
