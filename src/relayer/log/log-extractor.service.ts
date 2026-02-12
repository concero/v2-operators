import { Log } from 'viem';

import { Nullable } from '../../types/common';
import { ContextProvider } from '../services';
import { Context } from '../types'; // @todo: name better (requests log by srcChainSelector, blockNumber & messageId manually)

// @todo: name better (requests log by srcChainSelector, blockNumber & messageId manually)
export class LogExtractorService extends ContextProvider {
    constructor(context: Context) {
        super('LogExtractorService', context);
    }

    async extractLog(
        srcChainSelector: number,
        srcNetworkName: string,
        blockNumber: bigint,
        messageId: string,
    ): Promise<Nullable<Log>> {
        const fromBlock = blockNumber - 10n;
        const toBlock = blockNumber;
        const address = this.context.chainsManager.getRouterByChainSelector(srcChainSelector);

        const client = this.context.viemClient.getClients(srcNetworkName).publicClient;

        const logs = await client.getLogs({
            address,
            event: this.context.config.messageSentEventAbi,
            fromBlock,
            toBlock,
        });

        const log = logs?.find(log => log.topics?.[1]?.toLowerCase() === messageId?.toLowerCase());

        return log ?? null;
    }
}
