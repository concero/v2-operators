import { Address, Chain as ViemChain } from 'viem';
import { ConceroNetwork, HttpClient, LoggerInterface, ViemClientManager, } from '@concero/operator-utils';
import { NetworkUpdateListener } from '@concero/operator-utils/dist/types/managers/NetworkUpdateListener';

import { globalConfig } from '../constants';
import { Chain } from '../types';
import { ObjectLib } from '../utils';

export class ChainManager {
    private readonly logger: LoggerInterface;
    private readonly httpClient: HttpClient;
    private readonly viemClientManager: ViemClientManager;

    private _isInitialized = false;
    private _isFetching = false;
    private _fetchingInterval: number;
    private _listeners: NetworkUpdateListener[] = [];
    private _chains: Record<Chain['chainSelector'], Chain> = {};

    constructor(
        logger: LoggerInterface,
        httpClient: HttpClient,
        viemClientManager: ViemClientManager,
        fetchingInterval: number,
    ) {
        this.logger = logger;
        this.httpClient = httpClient;
        this.viemClientManager = viemClientManager;
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

    async startPolling() {
        if (this._isInitialized) {
            return;
        }
        this._isInitialized = true;
        await this.feed();
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
                viemChain: this.viemClientManager.getClients(i.name)?.publicClient
                    ?.chain as unknown as ViemChain,
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

    getNetworkOptionsByChainSelector(chainSelector: number): Chain {
        const options = this._chains?.[chainSelector];

        if (!options) {
            throw new Error(
                `Options not found for chain: ${this._chains?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return options;
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
            // this.logger.warn(
            //     `FinalityTagEnabled not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            // );

            return false;
        }

        return Boolean(finalityConfirmations);
    }
}
