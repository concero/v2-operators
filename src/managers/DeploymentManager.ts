import { Address } from 'viem';
import {
    ConceroNetwork,
    ConceroNetworkManager,
    HttpClient,
    IConceroNetworkManager,
    LoggerInterface,
    NetworkUpdateListener,
} from '@concero/operator-utils';

import { globalConfig } from '../constants';
import { Chain } from '../types';
import { ObjectLib } from '../utils';

export class DeploymentManager implements NetworkUpdateListener {
    private static instance: DeploymentManager;
    private chainOptions: Record<Chain['chainSelector'], Chain> = {};

    private readonly networkManager: IConceroNetworkManager;
    private readonly logger: LoggerInterface;
    private readonly httpClient: HttpClient;

    private constructor(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        httpClient: HttpClient,
    ) {
        this.logger = logger;
        this.networkManager = networkManager;
        this.httpClient = httpClient;
    }

    static createInstance(
        logger: LoggerInterface,
        networkManager: ConceroNetworkManager,
        httpClient: HttpClient,
    ): DeploymentManager {
        DeploymentManager.instance = new DeploymentManager(logger, networkManager, httpClient);
        return DeploymentManager.instance;
    }

    getConceroRouters(): Record<string, Address> {
        let routers: Record<string, Address> = {};
        Object.values(this.chainOptions).map(i => {
            if (i?.deployments?.router) {
                routers[i.name] = i.deployments.router;
            }
        });
        return routers;
    }

    getRouterByChainSelector(chainSelector: number): Address {
        const router = this.chainOptions?.[chainSelector]?.deployments?.router;

        if (!router) {
            throw new Error(
                `Router not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return router;
    }

    getConceroRelayerLibByChainSelector(chainSelector: number): Address {
        const relayerLib = this.chainOptions?.[chainSelector]?.deployments?.relayerLib;

        if (!relayerLib) {
            throw new Error(
                `RelayerLib not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return relayerLib;
    }

    getConceroValidatorLibByChainSelector(chainSelector: number): Address {
        const validatorLib = this.chainOptions?.[chainSelector]?.deployments?.validatorLib;

        if (!validatorLib) {
            throw new Error(
                `ValidatorLib not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }
        return validatorLib;
    }

    getNetworkNameByChainSelector(chainSelector: number): string {
        return this.chainOptions[chainSelector]?.name;
    }

    getMinBlockConformationsByChainSelector(chainSelector: number): bigint {
        const minBlockConfirmations = this.chainOptions?.[chainSelector]?.minBlockConfirmations;

        if (typeof minBlockConfirmations !== 'number') {
            throw new Error(
                `FinalityConfirmations not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return BigInt(minBlockConfirmations);
    }

    getFinalityBlockConformationsByChainSelector(chainSelector: number): bigint {
        const finalityConfirmations = this.chainOptions?.[chainSelector]?.finalityConfirmations;

        if (typeof finalityConfirmations !== 'number') {
            throw new Error(
                `FinalityConfirmations not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );
        }

        return BigInt(finalityConfirmations);
    }

    getFinalityTagEnabled(chainSelector: number): boolean {
        const finalityConfirmations = this.chainOptions?.[chainSelector]?.finalityTagEnabled;

        if (typeof finalityConfirmations !== 'boolean') {
            this.logger.warn(
                `FinalityTagEnabled not found for chain: ${this.chainOptions?.[chainSelector]?.name || `[selector=${chainSelector}]`}`,
            );

            return false;
        }

        return Boolean(finalityConfirmations);
    }

    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        try {
            this.chainOptions = await this.fetchChainOptions();
            this.logger.debug(`Found deployments ${ObjectLib.stringify(this.chainOptions)}`);

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
