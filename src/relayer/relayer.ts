import { LogModule } from './log';
import { ManagerProvider } from './services';
import { Config } from './types';
import { VerifierModule } from './verifier';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierModule!: VerifierModule;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.logModule = new LogModule(this.context);
        await this.logModule.init();
        this.verifierModule = new VerifierModule(this.context);
        await this.verifierModule.init();
    }
}
