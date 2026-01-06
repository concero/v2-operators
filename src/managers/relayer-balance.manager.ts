import { zeroAddress } from 'viem';
import { BalanceManager, BalanceManagerConfig, ConceroNetwork, LoggerInterface, } from '@concero/operator-utils';
import { ITxReader, IViemClientManager } from '@concero/operator-utils/src/types';

export class RelayerBalanceManager extends BalanceManager {
    private readonly _logger: LoggerInterface;

    private constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: BalanceManagerConfig,
    ) {
        super(logger, viemClientManager, txReader, config);
        this._logger = logger;
    }

    public static createInstance(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: BalanceManagerConfig,
    ): RelayerBalanceManager {
        return new RelayerBalanceManager(logger, viemClientManager, txReader, config);
    }

    public async initialize(): Promise<void> {
        await super.initialize();

        for (const network of this.getActiveNetworks()) {
            this.registerNativeTokenWatch(network);
        }

        await this.initializeBalances();
        this.beginWatching();
    }

    public setActiveNetworks(networks: ConceroNetwork[]): void {
        super.setActiveNetworks(networks);

        for (const network of networks) {
            this.registerNativeTokenWatch(network);
        }

        this.initializeBalances().catch(error => {
            this._logger.error(`Failed to initialize balances during network update: ${error}`);
        });

        this.beginWatching();
    }

    /**
     * Initialize all balances immediately and wait for completion
     * This ensures we have valid balance data before operations begin
     */
    private async initializeBalances(): Promise<void> {
        await this.forceUpdate();
    }

    private registerNativeTokenWatch(network: ConceroNetwork): void {
        this.registerToken(network, 'NATIVE', zeroAddress);
    }
}
