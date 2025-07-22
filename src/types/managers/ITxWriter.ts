import { SimulateContractParameters } from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

export interface ITxWriter {
    callContract(network: ConceroNetwork, params: SimulateContractParameters): Promise<string>;
    initialize(): Promise<void>;
    dispose(): void;
}
