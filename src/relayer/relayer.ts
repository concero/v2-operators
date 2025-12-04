import { LogModule } from './log';
import { ManagerProvider } from './services';
import { Config } from './types';
import { JobQueue } from './verifier';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierProcessor!: VerifierProcessor;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.logModule = new LogModule(this.context);
        await this.logModule.init();
        this.verifierProcessor = new VerifierProcessor(this.context);
        this.verifierProcessor.init();
    }
}
