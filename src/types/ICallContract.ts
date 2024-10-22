import { ConceroNetwork } from "./ConceroNetwork";
import { Abi, Address } from "viem";

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
