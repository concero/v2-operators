import { ConceroNetwork } from "../ConceroNetwork";

import { NetworkUpdateListener } from "./NetworkUpdateListener";

export interface INetworkManager {
    initialize(): Promise<void>;
    dispose(): void;
    getMainnetNetworks(): Record<string, ConceroNetwork>;
    getTestnetNetworks(): Record<string, ConceroNetwork>;
    getAllNetworks(): Record<string, ConceroNetwork>;
    getActiveNetworks(): ConceroNetwork[];
    getNetworkById(chainId: number): ConceroNetwork;
    getNetworkByName(name: string): ConceroNetwork;
    getNetworkBySelector(selector: string): ConceroNetwork;
    getVerifierNetwork(): ConceroNetwork | undefined;
    forceUpdate(): Promise<void>;
    triggerInitialUpdates(): Promise<void>;
    registerUpdateListener(listener: NetworkUpdateListener): void;
    unregisterUpdateListener(listener: NetworkUpdateListener): void;
}
