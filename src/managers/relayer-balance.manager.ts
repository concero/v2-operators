import {
    ConceroChain,
    ConceroNetwork,
    IBalanceManagerSender,
    IViemClientManager,
    NetworkUpdateListener,
    NewBalanceManager,
} from '@concero/operator-utils';
import { WebClient } from '@slack/web-api';

class SlackSender implements IBalanceManagerSender {
    private readonly client: WebClient;
    private readonly slackBotToken = process.env.NOTIFICATIONS_SLACK_BOT_TOKEN as string;
    private readonly slackMonitoringChannelId = process.env
        .NOTIFICATIONS_SLACK_MONITORING_SYSTEM_CHANNEL_ID as string;

    constructor() {
        this.client = new WebClient(this.slackBotToken);

        if (!this.slackBotToken) {
            throw new Error('No slack bot token found.');
        }

        if (!this.slackMonitoringChannelId) {
            throw new Error('No slack monitoring channelId found.');
        }
    }

    async send(data: {
        chain: ConceroChain;
        network: ConceroNetwork;
        expectedBalance: bigint;
        actualBalance: bigint;
    }): Promise<void> {
        try {
            await this.client.chat.postMessage({
                text: `Stage balance for ${data.chain.nativeCurrency.name} on ${data.chain.name} is below minimum!\nCurrent balance: ${String(data.actualBalance)}\nTop-up required: ${String(data.expectedBalance - data.actualBalance)}`,
                channel: this.slackMonitoringChannelId,
            });
        } catch (e) {
            console.log(`Slack sender Failed: ${e}`);
        }
    }
}

export class RelayerBalanceManager extends NewBalanceManager implements NetworkUpdateListener {
    constructor(viemClientManager: IViemClientManager) {
        super({
            pollingInterval: 20 * 60 * 1000,
            viemClientManager: viemClientManager as any,
            sender: new SlackSender(),
            gasLimit: 300_000,
            actionsCount: 100,
        });
    }
    async onNetworksUpdated(networks: ConceroNetwork[]): Promise<void> {
        await this.setNetworks(networks);
    }
}
