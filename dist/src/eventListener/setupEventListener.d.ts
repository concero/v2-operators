import { AbiEvent, type Address, Log } from 'viem';
import { ConceroNetwork } from '../types/ConceroNetwork';
export interface EventListenerHandle {
    stop: () => void;
}
export declare function setupEventListener<T>(network: ConceroNetwork, contractAddress: Address, onLogs: (logs: Log[], network: ConceroNetwork) => Promise<void>, event: AbiEvent, blockManager: any): Promise<EventListenerHandle>;
//# sourceMappingURL=setupEventListener.d.ts.map