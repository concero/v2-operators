import { ViemClients } from "../../common/managers/ViemClientManager";

import { ConceroNetwork } from "../ConceroNetwork";

import { RpcUpdateListener } from "./RpcUpdateListener";

export interface IViemClientManager extends RpcUpdateListener {
    initialize(): Promise<void>;
    getClients(chain: ConceroNetwork): ViemClients;
    updateClientsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    dispose(): void;
}
