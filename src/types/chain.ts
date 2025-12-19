import { Address } from 'viem';

// @todo: move to operator/utils

export enum DeploymentType {
    Router = 'router',
    ValidatorLib = 'validatorLib',
    RelayerLib = 'relayerLib',
}
export type Chain = {
    id: string;
    chainSelector: number;
    name: string;
    isTestnet: boolean;
    finalityTagEnabled: boolean;
    finalityConfirmations: number;
    minBlockConfirmations: number;
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
