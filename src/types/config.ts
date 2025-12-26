import { Abi, AbiEvent } from 'viem';

export type Config = {
    routerContractAbi: Abi;
    messageSentEventAbi: AbiEvent;
};
