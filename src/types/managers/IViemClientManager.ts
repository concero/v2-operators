import { NetworkUpdateListener } from './NetworkUpdateListener';

import { ViemClients } from '../../common/managers/ViemClientManager';
import { ConceroNetwork } from '../ConceroNetwork';

export interface IViemClientManager extends NetworkUpdateListener {
    initialize(): Promise<void>;
    getClients(chain: ConceroNetwork): ViemClients;
    updateClientsForNetworks(networks: ConceroNetwork[]): Promise<void>;
    dispose(): void;
}
