import { LogProcessor } from './log.processor';
import { RelayerSetup } from './relayer-setup';
import { Config } from './types';
import { VerifierProcessor } from './verifier';

export class Relayer extends RelayerSetup {
    private readonly logProcessor: LogProcessor;
    private readonly verifierProcessor: VerifierProcessor;

    constructor(config: Config) {
        super(config);
        this.logProcessor = new LogProcessor(this.context);
        this.verifierProcessor = new VerifierProcessor(this.context);

        void this.logProcessor.setup();
        void this.verifierProcessor.setup();
    }
}
