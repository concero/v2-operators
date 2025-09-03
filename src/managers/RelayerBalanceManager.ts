import { zeroAddress } from 'viem';
import { BalanceManager } from '@concero/operator-utils';
import type {
    BalanceManagerConfig,
    ConceroNetwork,
    ITxReader,
    IViemClientManager,
    LoggerInterface,
} from '@concero/operator-utils';

export interface RelayerBalanceManagerConfig extends BalanceManagerConfig {}

export class RelayerBalanceManager extends BalanceManager {
    private constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: RelayerBalanceManagerConfig,
    ) {
        super(logger, viemClientManager, txReader, config);
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

        this.initializeBalances().catch(error => {
            this.logger.error(`Failed to initialize balances during network update: ${error}`);
        });

        this.beginWatching();
    }

    private registerNativeTokenWatch(network: ConceroNetwork): void {
        this.registerToken(network, 'NATIVE', zeroAddress);
    }
}
