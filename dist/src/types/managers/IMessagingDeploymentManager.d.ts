import { NetworkUpdateListener } from './NetworkUpdateListener';
import { Address } from 'viem';
export interface IMessagingDeploymentManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getRouterByChainName(chainName: string): Promise<Address>;
    getConceroRouters(): Promise<Record<string, Address>>;
    getConceroVerifier(): Promise<Address>;
}
//# sourceMappingURL=IMessagingDeploymentManager.d.ts.map