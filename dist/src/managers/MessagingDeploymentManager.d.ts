import { ManagerBase } from './ManagerBase';
import { LoggerInterface } from '@concero/operator-utils';
import { ConceroNetworkManager } from '@concero/operator-utils';
import { Address } from 'viem';
import { ConceroNetwork } from '../types/ConceroNetwork';
import { DeploymentManagerConfig } from '../types/ManagerConfigs';
import { IMessagingDeploymentManager, NetworkUpdateListener } from '../types/managers';
export declare class MessagingDeploymentManager extends ManagerBase implements IMessagingDeploymentManager, NetworkUpdateListener {
    private static instance;
    private conceroRoutersMapByChainName;
    private conceroVerifier;
    private deploymentFetcher;
    private networkManager;
    private logger;
    private config;
    private readonly routerPattern;
    private readonly verifierPattern;
    private constructor();
    static createInstance(logger: LoggerInterface, networkManager: ConceroNetworkManager, config: DeploymentManagerConfig): MessagingDeploymentManager;
    initialize(): Promise<void>;
    static getInstance(): MessagingDeploymentManager;
    getRouterByChainName(chainName: string): Promise<Address>;
    getConceroRouters(): Promise<Record<string, Address>>;
    getConceroVerifier(): Promise<Address>;
    onNetworksUpdated(networks: ConceroNetwork[]): Promise<void>;
    private processDeployments;
    hasValidDeployments(networkName: string): boolean;
    dispose(): void;
}
//# sourceMappingURL=MessagingDeploymentManager.d.ts.map