import { BalanceManager } from '@concero/operator-utils';
import type { BalanceManagerConfig, ConceroNetwork, ITxReader, IViemClientManager, LoggerInterface } from '@concero/operator-utils';
interface RelayerBalanceManagerConfig extends BalanceManagerConfig {
    defaultMinBalance: bigint;
    minBalances?: Record<string, bigint>;
}
export declare class RelayerBalanceManager extends BalanceManager {
    private readonly defaultMinBalance;
    private readonly minBalances;
    private constructor();
    static createInstance(logger: LoggerInterface, viemClientManager: IViemClientManager, txReader: ITxReader, config: RelayerBalanceManagerConfig): RelayerBalanceManager;
    initialize(): Promise<void>;
    /**
     * Initialize all balances immediately and wait for completion
     * This ensures we have valid balance data before operations begin
     */
    private initializeBalances;
    setActiveNetworks(networks: ConceroNetwork[]): void;
    hasMinBalance(networkName: string): boolean;
    getMinBalanceForNetwork(networkName: string): bigint;
    getNativeBalance(networkName: string): bigint;
    private registerNativeTokenWatch;
}
export {};
//# sourceMappingURL=RelayerBalanceManager.d.ts.map