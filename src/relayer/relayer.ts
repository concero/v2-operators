import { LoggerInterface } from '@concero/operator-utils';
import { LogProcessor } from './logs';
import { RelayerSetup } from './relayer-setup';
import { Config } from './types';
import { VerifierProcessor } from './verifiers';

export class RelayerEngine extends RelayerSetup {
    private readonly logger: LoggerInterface;
    private readonly logProcessor: LogProcessor;
    private readonly verifierProcessor: VerifierProcessor;

    constructor(config: Config) {
        super(config);
        this.logger = this.context.logger.getLogger('RelayerEngine');
        this.logProcessor = new LogProcessor(this.context);
        this.verifierProcessor = new VerifierProcessor(this.context);

        void this.logProcessor.startWatcher();
        void this.verifierProcessor.startListener();
        void this.verifierProcessor.startPolling();
    }
}
