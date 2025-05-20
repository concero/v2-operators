import { Address } from "viem";

import { NetworkUpdateListener } from "./NetworkUpdateListener";

export interface IDeploymentsManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getRouterByChainName(chainName: string): Promise<Address>;
    getConceroVerifier(): Promise<Address>;
    updateDeployments(): Promise<void>;
}
