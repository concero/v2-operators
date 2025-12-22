import { LogModule } from './log';
import { ManagerProvider } from './services';
import { Config } from './types';
import { ValidatorModule } from './validator';
import { WatcherModule } from './watcher';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierModule!: ValidatorModule;
    private watcherModule!: WatcherModule;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.verifierModule = new ValidatorModule(this.context);
        await this.verifierModule.init();
        this.watcherModule = new WatcherModule(this.context);
        this.watcherModule.setupEachHandler();
        this.logModule = new LogModule(this.context);
        this.logModule.setupEachHandler();
    }
}
