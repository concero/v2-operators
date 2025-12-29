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
        srcNetworkName: string,
        blockNumber: bigint,
        messageId: string,
    ): Promise<Nullable<Log>> {
        const client = this.context.viemClient.getClients(srcNetworkName).publicClient;

        const logs = await client.getLogs({
            event: this.context.config.messageSentEventAbi,
            fromBlock: blockNumber,
            toBlock: blockNumber + 10n,
        });

        const log = logs.find(log => log.topics?.[2] === messageId);

        return log ?? null;
    }
}
