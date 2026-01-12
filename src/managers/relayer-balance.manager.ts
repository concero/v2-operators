import {
    ConceroChain,
    ConceroNetwork,
    IBalanceManagerSender,
    IViemClientManager,
    NewBalanceManager,
} from '@concero/operator-utils';

class SlackSender implements IBalanceManagerSender {
    async send(data: {
        chain: ConceroChain;
        network: ConceroNetwork;
        expectedBalance: bigint;
        actualBalance: bigint;
    }): Promise<void> {
        console.log('Sending to slack ...');
    }
}

export class RelayerBalanceManager extends NewBalanceManager {
    constructor(viemClientManager: IViemClientManager) {
        super({
            pollingInterval: 20 * 60 * 1000,
            viemClientManager: viemClientManager as any,
            sender: new SlackSender(),
            gasLimit: 300_000,
            actionsCount: 100,
        });
    }
}
