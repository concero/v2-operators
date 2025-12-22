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
        await this.verifierModule.setup();
        this.watcherModule = new WatcherModule(this.context);
        await this.watcherModule.setup();
        this.logModule = new LogModule(this.context);
        await this.logModule.setup();
    }
}
