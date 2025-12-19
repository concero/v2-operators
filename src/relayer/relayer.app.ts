import { LogModule } from './log';
import { ManagerProvider } from './services';
import { Config } from './types';
import { VerifierModule } from './verifier';
import { WatcherModule } from './watcher';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierModule!: VerifierModule;
    private watcherModule!: WatcherModule;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.logModule = new LogModule(this.context);
        this.verifierModule = new VerifierModule(this.context);
        await this.verifierModule.init();
        this.watcherModule = new WatcherModule(this.context);
    }
}
