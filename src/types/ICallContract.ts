import { Abi, Address } from "viem";

import { ConceroNetwork } from "./ConceroNetwork";

export interface ICallContract {
    chain: ConceroNetwork;
    args: any[];
    address: Address;
    functionName: string;
    abi: Abi;
    options?: {
        gasPrice?: bigint;
        gas?: bigint;
    };
}
