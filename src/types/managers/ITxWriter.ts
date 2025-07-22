import { PublicClient, SimulateContractParameters, WalletClient } from "viem";

import { ConceroNetwork } from "../ConceroNetwork";

export interface ITxWriter {
    callContract(
        walletClient: WalletClient,
        publicClient: PublicClient,
        network: ConceroNetwork,
        params: SimulateContractParameters,
    ): Promise<string>;
    initialize(): Promise<void>;
    dispose(): void;
}
