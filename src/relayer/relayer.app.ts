import { ApiModule } from './api';
import { LogModule } from './log';
import { ManagerProvider } from './services';
import { ValidatorModule } from './validator';
import { WatcherModule } from './watcher';

import { Config } from '../types';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierModule!: ValidatorModule;
    private watcherModule!: WatcherModule;
    private apiModule!: ApiModule;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        const refetchLog = this.logModule.refetchLog.bind(this.logModule);
        await this.initManagers();
        this.verifierModule = new ValidatorModule(this.context);
        await this.verifierModule.init();
        this.watcherModule = new WatcherModule(this.context);
        await this.watcherModule.setupEachHandler();
        this.logModule = new LogModule(this.context);
        await this.logModule.setupEachHandler();
        this.apiModule = new ApiModule(this.context);
        await this.apiModule.init(refetchLog);
    }
}
