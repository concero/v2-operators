import { Address, Chain as ViemChain } from 'viem';
import { ConceroNetwork, HttpClient, LoggerInterface } from '@concero/operator-utils';
import { NetworkUpdateListener } from '@concero/operator-utils/dist/types/managers/NetworkUpdateListener';

import { globalConfig } from '../constants';
import { Chain } from '../types';
import { ObjectLib } from '../utils';

export class ChainManager {
    private readonly logger: LoggerInterface;
    private readonly httpClient: HttpClient;

    private _isInitialized = false;
    private _isFetching = false;
    private _fetchingInterval: number;
    private _listeners: NetworkUpdateListener[] = [];
    private _chains: Record<Chain['chainSelector'], Chain> = {};

    constructor(logger: LoggerInterface, httpClient: HttpClient, fetchingInterval: number) {
        this.logger = logger;
        this.httpClient = httpClient;
        this._fetchingInterval = fetchingInterval;
    }

    get chains(): Chain[] {
        return Object.values(this._chains);
    }

    get activeChains(): Chain[] {
        return this.chains.filter(
            i => i?.rpcUrls?.length && i?.rpcUrls?.length > 0 && i?.deployments?.router,
        );
    }

    async initialize(): Promise<void> {
        if (this._isInitialized) {
            return;
        }

        try {
            await this.feed();
            this._isInitialized = true;
        } catch (e) {
            console.error('initialize Error while initializing chains', e);
        }
    }

    async startPolling() {
        if (!this._isInitialized) {
            return;
        }

        setInterval(() => this.feed(), this._fetchingInterval);
    }

    registerListener(listener: NetworkUpdateListener) {
        const existingIndex = this._listeners.findIndex(
            existing => existing.constructor.name === listener.constructor.name,
        );

        if (existingIndex === -1) {
            this._listeners.push(listener);
        } else {
            this.logger.warn(`Update listener already registered: ${listener.constructor.name}`);
        }
        this._listeners.push(listener);
    }

    private async feed(): Promise<void> {
        try {
            if (this._isFetching || !this._isInitialized) {
                return;
            }

            this._isFetching = true;
            this.logger.info(`feed Fetching`);
            this._chains = await this.fetchChains();
            this.logger.debug(`feed Found deployments ${ObjectLib.stringify(this._chains)}`);
            const activeChains = this.activeChains;
            const networks: ConceroNetwork[] = activeChains.map(i => ({
                id: Number(i.id),
                name: i.name,
                chainSelector: String(i.chainSelector),
                viemChain: {
                    id: i.id,
                    name: i.name,
                    rpcUrls: i.rpcUrls,
                    nativeCurrency: {
                        decimals: i.nativeCurrency.decimals,
                        name: i.nativeCurrency.name,
                        symbol: i.nativeCurrency.symbol,
                    },
                } as unknown as ViemChain,
                finalityConfirmations: i.finalityConfirmations ?? 1,
                confirmations: i.minBlockConfirmations,
                type: 'mainnet',
                finalityTagEnabled: i.finalityTagEnabled,
                accounts: [],
                addresses: { conceroRouter: i.deployments.router as Address },
            }));
            this._listeners.forEach(listener => listener.onNetworksUpdated(networks));
            this.logger.info(
                `feed Successfully fetched chains, active (size=${activeChains.length}) are: ${activeChains.join(',')}`,
            );
        } catch (err) {
            this.logger.error(`feed Failed to update deployments after network update: ${err}`);
            throw err;
        } finally {
            this._isFetching = false;
        }
    }

    private async fetchChains(): Promise<Record<Chain['chainSelector'], Chain>> {
        const response = await this.httpClient.get<string>(globalConfig.chainOptionsUrl, {
            responseType: 'text',
        });

        return JSON.parse(response) as Record<Chain['chainSelector'], Chain>;
    }

    getNetworkNameByChainSelector(chainSelector: number): string {
        const name = this._chains?.[chainSelector]?.name;

        if (!name) {
            throw new Error(
                `Name not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return name;
    }

    getRouterByChainSelector(chainSelector: number): Address {
        const router = this._chains?.[chainSelector]?.deployments?.router;

        if (!router) {
            throw new Error(
                `Router not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return router;
    }

    getConceroRelayerLibByChainSelector(chainSelector: number): Address {
        const relayerLib = this._chains?.[chainSelector]?.deployments?.relayerLib;

        if (!relayerLib) {
            throw new Error(
                `RelayerLib not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return relayerLib;
    }

    getConceroValidatorLibByChainSelector(chainSelector: number): Address {
        const validatorLib = this._chains?.[chainSelector]?.deployments?.validatorLib;

        if (!validatorLib) {
            throw new Error(
                `ValidatorLib not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }
        return validatorLib;
    }

    getMinBlockConformationsByChainSelector(chainSelector: number): bigint {
        const minBlockConfirmations = this._chains?.[chainSelector]?.minBlockConfirmations;

        if (typeof minBlockConfirmations !== 'number') {
            return 1n;
        }

        return BigInt(minBlockConfirmations);
    }

    getFinalityBlockConformationsByChainSelector(chainSelector: number): bigint {
        const finalityConfirmations = this._chains?.[chainSelector]?.finalityConfirmations;

        if (typeof finalityConfirmations !== 'number') {
            throw new Error(
                `FinalityConfirmations not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return BigInt(finalityConfirmations);
    }

    getFinalityTagEnabled(chainSelector: number): boolean {
        const finalityConfirmations = this._chains?.[chainSelector]?.finalityTagEnabled;

        if (typeof finalityConfirmations !== 'boolean') {
            return false;
        }

        return Boolean(finalityConfirmations);
    }
}
