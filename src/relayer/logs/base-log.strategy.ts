import { LogParserService } from './log-parser.service';

import { RelayerContext } from '../relayer-context';
import { Context } from '../types';

export abstract class BaseLogStrategy extends RelayerContext {
    protected readonly logParser: LogParserService;

    protected constructor(name: string, context: Context) {
        super(name, context);
        this.logParser = new LogParserService(context);
    }
}
