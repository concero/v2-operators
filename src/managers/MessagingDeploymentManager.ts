import { getEnvVar } from '../utils/getEnvVar';

import { Address } from 'viem';
import {
    ConceroNetworkManager,
    DeploymentFetcher,
    DeploymentPattern,
    IConceroNetworkManager,
    LoggerInterface,
    ParsedDeployment,
} from '@concero/operator-utils';
import { ManagerBase } from './ManagerBase';

import { ConceroNetwork } from '../types/ConceroNetwork';
import { DeploymentManagerConfig } from '../types/ManagerConfigs';
import { IMessagingDeploymentManager, NetworkUpdateListener } from '../types/managers';

export class MessagingDeploymentManager
    extends ManagerBase
    implements IMessagingDeploymentManager, NetworkUpdateListener
{
    private static instance: MessagingDeploymentManager;

    private conceroRoutersMapByChainName: Record<string, Address> = {};
    private conceroVerifier: Address | undefined;
    private deploymentFetcher: DeploymentFetcher;
    private networkManager: IConceroNetworkManager;
    private logger: LoggerInterface;
    private config: DeploymentManagerConfig;

    private readonly routerPattern: DeploymentPattern = /^CONCERO_ROUTER_PROXY_(?!ADMIN)(\w+)$/;
    private readonly verifierPattern: DeploymentPattern = /^CONCERO_VERIFIER_PROXY_(?!ADMIN)(\w+)$/;

    private constructor(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        config: DeploymentManagerConfig,
    ) {
        super();
        this.logger = logger;
        this.config = config;
        this.networkManager = networkManager;
        this.deploymentFetcher = new DeploymentFetcher(logger);
    }

    public static createInstance(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        config: DeploymentManagerConfig,
    ): MessagingDeploymentManager {
        MessagingDeploymentManager.instance = new MessagingDeploymentManager(
            logger,
            networkManager,
            config,
        );
        return MessagingDeploymentManager.instance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) return;
        try {
            await super.initialize();
            // Initial fetch of deployments will happen on first network update
            this.logger.debug('Initialized');
        } catch (error) {
            this.logger.error(
                `Failed to initialize: ${error instanceof Error ? error.message : String(error)}. Stack: ${error instanceof Error && error.stack ? error.stack : 'No stack trace available'}`,
            );
            throw error;
        }
    }

    public static getInstance(): MessagingDeploymentManager {
        if (!MessagingDeploymentManager.instance) {
            throw new Error(
                'MessagingDeploymentManager is not initialized. Call createInstance() first.',
            );
        }
        return MessagingDeploymentManager.instance;
    }

    async getRouterByChainName(chainName: string): Promise<Address> {
        if (this.config.networkMode === 'localhost') {
            return getEnvVar('CONCERO_ROUTER_PROXY_LOCALHOST') as Address;
        }

        const router = this.conceroRoutersMapByChainName[chainName];

        if (!router) {
            throw new Error(`Router not found for chain: ${chainName}`);
        }

        return router;
    }

    async getConceroRouters(): Promise<Record<string, Address>> {
        if (this.config.networkMode === 'localhost') {
            return {
                [getEnvVar('LOCALHOST_FORK_CHAIN_ID')]: getEnvVar(
                    'CONCERO_ROUTER_PROXY_LOCALHOST',
                ) as Address,
            };
        }

        return this.conceroRoutersMapByChainName;
    }

    async getConceroVerifier(): Promise<Address> {
        if (this.config.networkMode === 'localhost') {
            return getEnvVar('CONCERO_VERIFIER_PROXY_LOCALHOST') as Address;
        }

        if (this.conceroVerifier !== undefined) return this.conceroVerifier;

        if (!this.conceroVerifier) {
            throw new Error('Concero verifier address not found after update');
        }

        return this.conceroVerifier;
    }

    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        try {
            const patterns = [this.routerPattern, this.verifierPattern];
            const deployments = await this.deploymentFetcher.getDeployments(
                this.config.conceroDeploymentsUrl,
                patterns,
            );
            await this.processDeployments(deployments, networks);

            if (this.config.networkMode !== 'localhost') {
                for (const network of networks) {
                    if (!this.hasValidDeployments(network.name)) {
                        this.networkManager.excludeNetwork(
                            network.name,
                            'Missing deployment address',
                        );
                    }
                }
            }
        } catch (err) {
            this.logger.error(
                `Failed to update deployments after network update: ${err instanceof Error ? err.message : String(err)}. Stack: ${err instanceof Error && err.stack ? err.stack : 'No stack trace available'}`,
            );
            throw err;
        }
    }

    private async processDeployments(
        deployments: ParsedDeployment[],
        networks: ConceroNetwork[],
    ): Promise<void> {
        // Create a set for efficient lookup
        const activeNetworkNames = new Set(networks.map(n => n.name));

        // Remove deployments for networks that are no longer active
        const currentNetworkNames = Object.keys(this.conceroRoutersMapByChainName);
        for (const networkName of currentNetworkNames) {
            if (!activeNetworkNames.has(networkName)) {
                delete this.conceroRoutersMapByChainName[networkName];
                this.logger.debug(`Removed deployment for inactive network: ${networkName}`);
            }
        }

        // Process router deployments
        const routerDeployments = deployments.filter(d => d.key.match(this.routerPattern));
        const routerMap: Record<string, Address> = {};

        for (const deployment of routerDeployments) {
            // Only store deployments for active networks
            if (activeNetworkNames.has(deployment.networkName)) {
                routerMap[deployment.networkName] = deployment.value as Address;
            }
        }

        // Update the router deployments
        Object.assign(this.conceroRoutersMapByChainName, routerMap);

        // Process verifier deployment
        const networkSuffix =
            this.config.networkMode === 'testnet' ? 'arbitrumSepolia' : 'arbitrum';
        const verifierDeployment = deployments.find(
            d => d.key.match(this.verifierPattern) && d.networkName === networkSuffix,
        );
        if (verifierDeployment) {
            this.conceroVerifier = verifierDeployment.value as Address;
        }
    }

    public hasValidDeployments(networkName: string): boolean {
        if (this.config.networkMode === 'localhost') {
            return true; // localhost always valid
        }

        // Check if router exists for this network
        const router = this.conceroRoutersMapByChainName[networkName];
        if (!router) {
            return false;
        }

        // Check if verifier exists (only check main verifier, not per-network)
        if (this.conceroVerifier === undefined) {
            return false;
        }

        return true;
    }
}
