import { LogProcessor } from './log.processor';
import { ManagerProvider } from './services';
import { Config } from './types';
import { VerifierProcessor } from './verifier';

export class Relayer extends ManagerProvider {
    private readonly logProcessor: LogProcessor;
    private readonly verifierProcessor: VerifierProcessor;

    constructor(config: Config) {
        super(config);
        this.logProcessor = new LogProcessor(this.context);
        this.verifierProcessor = new VerifierProcessor(this.context);

        void this.initialize();
        void this.logProcessor.setup();
        void this.verifierProcessor.setup();
    }
}
