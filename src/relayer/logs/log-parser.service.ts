import { Abi, decodeEventLog, Hex, Log } from 'viem';

import { DecodedLog } from '../../types/DecodedLog';
import { RelayerContext } from '../relayer-context';
import { Context } from '../types';

export class LogParserService extends RelayerContext {
    constructor(context: Context) {
        super('LogParserService', context);
    }

    parseLogs<Data = unknown>(logs: Log[], abi: Abi): DecodedLog<Data>[] {
        const parsedLogs = logs.map(log => this.parseLog(log, abi));
        return parsedLogs.filter(Boolean) as DecodedLog<Data>[];
    }

    parseLog<Data = unknown>(log: Log, abi: Abi): DecodedLog<Data> | null {
        try {
            const decoded = decodeEventLog({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true,
            });
            return {
                eventHash: log.topics?.[0] as Hex,
                eventName: decoded.eventName as unknown as string,
                data: decoded.args as Data,
                blockNumber: log.blockNumber as bigint,
                transactionHash: log.transactionHash as Hex,
            };
        } catch (error) {
            this.logger.error(`Log parsing failed: ${error}`);
            return null;
        }
    }
}
