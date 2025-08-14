import { NetworkUpdateListener } from './NetworkUpdateListener';

import { Address } from 'viem';

export interface IDeploymentsManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getRouterByChainName(chainName: string): Promise<Address>;
    getConceroVerifier(): Promise<Address>;
    updateDeployments(): Promise<void>;
}
