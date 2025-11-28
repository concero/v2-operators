import { Address } from 'viem';

import { RetryQueueService } from '../services';
import { ContextProvider } from '../services/context.provider';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextProvider {
    protected readonly reportJobQueue: RetryQueueService;

    protected constructor(name: string, context: Context, reportJobQueue: RetryQueueService) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }
}

enum DeploymentType {
    Router = 'router',
    ValidatorLib = 'validatorLib',
    RelayerLib = 'relayerLib',
}
type Chain = {
    id: number;
    selector: number;
    name: string;
    isTestnet: boolean;
    finalityConfirmations: number;
    rpcUrls: string[];
    blockExplorers: {
        name: string;
        url: string;
        apiUrl: string;
    }[];
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    deployments: Partial<Record<DeploymentType, Address>>;
};
const chains: Record<Chain['selector'], Chain> = {};
