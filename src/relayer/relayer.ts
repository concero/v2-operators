import { LogProcessor } from './log.processor';
import { ManagerProvider } from './services';
import { Config } from './types';
import { VerifierProcessor } from './verifier';

export class RelayerApp extends ManagerProvider {
    private logProcessor!: LogProcessor;
    private verifierProcessor!: VerifierProcessor;

    constructor(config: Config) {
        super(config);
    }

    async init(): Promise<void> {
        await this.initManagers();
        this.logProcessor = new LogProcessor(this.context);
        await this.logProcessor.init();
        this.verifierProcessor = new VerifierProcessor(this.context);
        this.verifierProcessor.init();
    }
}
