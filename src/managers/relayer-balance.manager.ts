import {
    ConceroNetworkManager,
    InsufficientBalanceNotifier,
    LoggerInterface,
    SlackNotifier,
    ViemClientManager,
} from '@concero/operator-utils';

class SlackSender extends SlackNotifier {
    constructor(logger: LoggerInterface) {
        super(
            {
                botToken: process.env.NOTIFICATIONS_SLACK_BOT_TOKEN as string,
                channelId: process.env.NOTIFICATIONS_SLACK_MONITORING_SYSTEM_CHANNEL_ID as string,
                batchWaitMs: 2 * 60 * 1000,
            },
            logger,
        );
    }
}

export class RelayerBalanceManager extends InsufficientBalanceNotifier {
    constructor(
        slackLogger: LoggerInterface,
        bmLogger: LoggerInterface,
        viemClientManager: ViemClientManager,
        networkManager: ConceroNetworkManager,
    ) {
        super({
            sender: new SlackSender(slackLogger),
            viemClientManager,
            networkManager,
            logger: bmLogger,
            gasLimit: 300_000,
            actionsCount: 100,
            pollingInterval: 30 * 60 * 1000,
            buildMessage: params =>
                `[Relayer ${process.env.OPERATOR_ADDRESS}] Balance for ${params.network.viemChain.nativeCurrency.name} on ${params.network.name} is below minimum!\nCurrent balance: ${String(params.actualBalance)}\nTop-up required: ${String(params.expectedBalance - params.actualBalance)}`,
            address: process.env.OPERATOR_ADDRESS as `0x${string}`,
        });
    }
}
