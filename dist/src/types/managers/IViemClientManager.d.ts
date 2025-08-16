import { NetworkUpdateListener } from './NetworkUpdateListener';
import { ViemClients } from '../../managers/ViemClientManager';
import { ConceroNetwork } from '../ConceroNetwork';
export interface IViemClientManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getClients(chain: ConceroNetwork): ViemClients;
    updateClientsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    dispose(): void;
}
//# sourceMappingURL=IViemClientManager.d.ts.map