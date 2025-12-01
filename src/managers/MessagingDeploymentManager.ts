import { Address } from 'viem';
import {
    ConceroNetworkManager,
    getEnvString,
    HttpClient,
    IConceroNetworkManager,
    LoggerInterface,
} from '@concero/operator-utils';
import { ManagerBase } from './ManagerBase';

import { globalConfig } from '../constants';
import { Chain } from '../types';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { DeploymentManagerConfig } from '../types/ManagerConfigs';
import { IMessagingDeploymentManager } from '../types/managers/IMessagingDeploymentManager';

export class MessagingDeploymentManager extends ManagerBase implements IMessagingDeploymentManager {
    private static instance: MessagingDeploymentManager;
    private chainOptions: Record<Chain['chainSelector'], Chain> = {};

    private readonly networkManager: IConceroNetworkManager;
    private readonly logger: LoggerInterface;
    private readonly config: DeploymentManagerConfig;
    private readonly httpClient: HttpClient;

    private constructor(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        config: DeploymentManagerConfig,
        httpClient: HttpClient,
    ) {
        super();
        this.logger = logger;
        this.config = config;
        this.networkManager = networkManager;
        this.httpClient = httpClient;
    }

    static createInstance(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        config: DeploymentManagerConfig,
        httpClient: HttpClient,
    ): MessagingDeploymentManager {
        MessagingDeploymentManager.instance = new MessagingDeploymentManager(
            logger,
            networkManager,
            config,
            httpClient,
        );
        return MessagingDeploymentManager.instance;
    }

    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await super.initialize();
            // Initial fetch of deployments will happen on first network update
            this.logger.debug('Initialized');
        } catch (error) {
            this.logger.error(`Failed to initialize: ${error}`);
            throw error;
        }
    }

    getConceroRouters(): Record<string, Address> {
        if (this.config.networkMode === 'localhost') {
            return {
                [getEnvString('LOCALHOST_FORK_CHAIN_ID')]: getEnvString(
                    'CONCERO_ROUTER_PROXY_LOCALHOST',
                ) as Address,
            };
        }
        let routers: Record<string, Address> = {};
        Object.values(this.chainOptions).map(i => {
            if (i?.deployments?.router) {
                routers[i.name] = i.deployments.router;
            }
        });
        return routers;
    }

    getRouterByChainName(chainName: string): Address {
        const router = Object.values(this.chainOptions)?.find(i => i.name === chainName)
            ?.deployments?.router;

        if (!router) {
            throw new Error(`Router not found for chain: ${chainName}`);
        }

        return router;
    }

    getConceroRelayerLibByChainName(chainName: string): Address {
        const relayerLib = Object.values(this.chainOptions)?.find(i => i.name === chainName)
            ?.deployments?.relayerLib;

        if (!relayerLib) {
            throw new Error(`RelayerLib not found for chain: ${chainName}`);
        }

        return relayerLib;
    }

    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        try {
            this.chainOptions = await this.fetchChainOptions();
            this.logger.debug(`Found deployments ${JSON.stringify(this.chainOptions)}`);

            for (const network of networks) {
                if (!this.hasValidDeployments(network.name)) {
                    this.networkManager.excludeNetwork(network.name, 'Missing deployment address');
                }
            }
        } catch (err) {
            this.logger.error(`Failed to update deployments after network update: ${err}`);
            throw err;
        }
    }

    private async fetchChainOptions(): Promise<Record<Chain['chainSelector'], Chain>> {
        const response = await this.httpClient.get<string>(globalConfig.chainOptionsUrl, {
            responseType: 'text',
        });

        return JSON.parse(response) as Record<Chain['chainSelector'], Chain>;
    }

    private hasValidDeployments(networkName: string): boolean {
        const chainDeployment = Object.values(this.chainOptions).find(i => i.name === networkName);
        return !(!chainDeployment || !chainDeployment?.deployments?.router);
    }
}
