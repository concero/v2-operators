import { BalanceManager } from '@concero/operator-utils';
import type {
    BalanceManagerConfig,
    ConceroNetwork,
    ITxReader,
    IViemClientManager,
    LoggerInterface,
} from '@concero/operator-utils';

interface RelayerBalanceManagerConfig extends BalanceManagerConfig {
    defaultMinBalance: bigint;
    minBalances?: Record<string, bigint>;
}

export class RelayerBalanceManager extends BalanceManager {
    private readonly defaultMinBalance: bigint;
    private readonly minBalances: Record<string, bigint>;

    private constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: RelayerBalanceManagerConfig,
    ) {
        super(logger, viemClientManager, txReader, config);
        this.defaultMinBalance = config.defaultMinBalance;
        this.minBalances = config.minBalances ?? {};
    }

    public static createInstance(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: RelayerBalanceManagerConfig,
    ): RelayerBalanceManager {
        return new RelayerBalanceManager(logger, viemClientManager, txReader, config);
    }

    public async initialize(): Promise<void> {
        await super.initialize();

        for (const network of this.activeNetworks) {
            this.registerNativeTokenWatch(network);
        }

        // Wait for initial balances to be populated before starting watchers
        await this.initializeBalances();
        this.beginWatching();
    }

    /**
     * Initialize all balances immediately and wait for completion
     * This ensures we have valid balance data before operations begin
     */
    private async initializeBalances(): Promise<void> {
        await this.forceUpdate();
    }

    public setActiveNetworks(networks: ConceroNetwork[]): void {
        super.setActiveNetworks(networks);

        for (const network of networks) {
            this.registerNativeTokenWatch(network);
        }

        // Initialize balances asynchronously without blocking
        this.initializeBalances().catch(error => {
            this.logger.error(`Failed to initialize balances during network update: ${error}`);
        });

        this.beginWatching();
    }

    public hasMinBalance(networkName: string): boolean {
        const currentBalance = this.getNativeBalances().get(networkName) ?? 0n;
        const minRequired = this.getMinBalanceForNetwork(networkName);

        return currentBalance >= minRequired;
    }

    public getMinBalanceForNetwork(networkName: string): bigint {
        return this.minBalances[networkName] ?? this.defaultMinBalance;
    }

    public getNativeBalance(networkName: string): bigint {
        return this.getNativeBalances().get(networkName) ?? 0n;
    }

    private registerNativeTokenWatch(network: ConceroNetwork): void {
        this.registerToken(network, 'NATIVE', '0x0000000000000000000000000000000000000000');
    }
}
