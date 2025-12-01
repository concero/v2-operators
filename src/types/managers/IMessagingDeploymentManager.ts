import { Address } from 'viem';
import { NetworkUpdateListener } from '@concero/operator-utils';

export interface IMessagingDeploymentManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getRouterByChainName(chainName: string): Address;
    getConceroRelayerLibByChainName(chainName: string): Address;
    getConceroValidatorLibByChainName: (chainName: string) => Address;
    getConceroRouters(): Record<string, Address>;
}
