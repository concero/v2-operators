import { Address } from 'viem';
import { NetworkUpdateListener } from '@concero/operator-utils';

export interface IMessagingDeploymentManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getRouterByChainName(chainName: string): Promise<Address>;
    getConceroRouters(): Promise<Record<string, Address>>;
    getConceroVerifier(): Promise<Address>;
}
