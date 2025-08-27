import { BalanceManager } from '@concero/operator-utils';
import type {
    BalanceManagerConfig,
    ConceroNetwork,
    ITxReader,
    IViemClientManager,
    LoggerInterface,
} from '@concero/operator-utils';
import { WebClient } from '@slack/web-api';
import { formatUnits } from 'viem';

interface RelayerBalanceManagerConfig extends BalanceManagerConfig {
    defaultMinBalance: bigint;
    minBalances?: Record<string, bigint>;
    slackChannelId: string;
    slackBotToken: string;
    slackIntervalMs: number;
}

export class RelayerBalanceManager extends BalanceManager {
    private readonly defaultMinBalance: bigint;
    private readonly minBalances: Record<string, bigint>;
    private readonly slackChannelId: string;
    private readonly slackBotToken: string;
    private readonly slackIntervalMs: number;

    private constructor(
        logger: LoggerInterface,
        viemClientManager: IViemClientManager,
        txReader: ITxReader,
        config: RelayerBalanceManagerConfig,
    ) {
        super(logger, viemClientManager, txReader, config);
        this.defaultMinBalance = config.defaultMinBalance;
        this.minBalances = config.minBalances ?? {};
        this.slackChannelId = config.slackChannelId || '';
        this.slackBotToken = config.slackBotToken || '';
        this.slackIntervalMs = config.slackIntervalMs || 60 * 60 * 1000;
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

        await this.checkAndNotifyInsufficientBalance();
        this.startPeriodicBalanceChecks();
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
        this.registerToken(network, 'NATIVE', '0x0000000000000000000000000000000000000000' as any);
    }

    private startPeriodicBalanceChecks(): void {
        setInterval(async () => {
            try {
                await this.checkAndNotifyInsufficientBalance();
            } catch (error) {
                this.logger.error('Error during periodic balance check:', error);
            }
        }, this.slackIntervalMs);
    }

    private async checkAndNotifyInsufficientBalance() {
        for (const network of this.activeNetworks) {
            const currentBalance = this.getNativeBalance(network.name);
            const minRequired = this.getMinBalanceForNetwork(network.name);

            if (currentBalance < minRequired) {
                const message = `RelayerBalanceManager: \n Insufficient gas on ${network.name} (chain ID: ${network.id}). \n Minimum required: ${formatUnits(minRequired, 18)}, \n Actual balance: ${formatUnits(currentBalance, 18)}`;

                await this.notifyInSlackAboutMinBalance(message);
            }
        }
    }

    private async notifyInSlackAboutMinBalance(message: string) {
        try {
            if (!this.slackChannelId || !this.slackBotToken) {
                this.logger.warn('Slack channel ID or bot token is not set');
                return;
            }
            const webClient = new WebClient(this.slackBotToken);

            const res = await webClient.chat.postMessage({
                channel: this.slackChannelId,
                text: message,
            });

            if (!res.ok) {
                this.logger.error(`Failed to send message to slack: ${res.error}`);
            } else {
                this.logger.debug(`Slack notification sent successfully: ${message}`);
            }
        } catch (error) {
            this.logger.error('Error sending Slack notification:', error);
        }
    }
}
