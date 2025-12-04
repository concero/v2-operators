import { LogModule } from './log';
import { JobQueue, ManagerProvider } from './services';
import { Config } from './types';
import { VerifierModule } from './verifier';

export class RelayerApp extends ManagerProvider {
    private logModule!: LogModule;
    private verifierModule!: VerifierModule;
    private jobQueue!: JobQueue;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.jobQueue = new JobQueue(this.context);
        this.logModule = new LogModule(this.context);
        await this.logModule.init();
        this.verifierModule = new VerifierModule(this.context, this.jobQueue);
        await this.verifierModule.init();
    }
}
