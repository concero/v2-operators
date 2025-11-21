import { LogProcessor } from './log.processor';
import { ApiService, ManagerProvider } from './services';
import { Config } from './types';
import { VerifierProcessor } from './verifier';

export class RelayerApp extends ManagerProvider {
    private readonly logProcessor: LogProcessor;
    private readonly verifierProcessor: VerifierProcessor;
    private readonly apiService: ApiService;

    constructor(config: Config) {
        super(config);
        this.initManagers();
        this.logProcessor = new LogProcessor(this.context);
        this.apiService = new ApiService(this.context);
        this.verifierProcessor = new VerifierProcessor(this.context);
    }

    async init(): Promise<void> {
        this.logProcessor.init();
        this.verifierProcessor.init();
        this.apiService.init();
    }
}
