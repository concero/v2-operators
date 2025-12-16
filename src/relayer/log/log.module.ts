import { LogBlockConformationsService } from './log-block-conformations.service';
import { LogWatcherService } from './log-watcher.service';

import { Context } from '../types';

export class LogModule {
    private readonly logFinalityService: LogBlockConformationsService;
    private readonly logWatcherService: LogWatcherService;

    constructor(context: Context) {
        this.logFinalityService = new LogBlockConformationsService(context);
        this.logWatcherService = new LogWatcherService(context, this.logFinalityService);
    }

    async init(): Promise<void> {
        this.logFinalityService.init();
        this.logWatcherService.init();
    }
}
