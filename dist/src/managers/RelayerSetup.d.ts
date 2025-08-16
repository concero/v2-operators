import type { ITxWriter, IViemClientManager, LoggerInterface, NetworkManager } from '@concero/operator-utils';
import { MessagingDeploymentManager } from './MessagingDeploymentManager';
export declare class RelayerSetup {
    private readonly logger;
    private readonly networkManager;
    private readonly viemClientManager;
    private readonly deploymentManager;
    private readonly txWriter;
    constructor(logger: LoggerInterface, networkManager: NetworkManager, viemClientManager: IViemClientManager, deploymentManager: MessagingDeploymentManager, txWriter: ITxWriter);
    static createInstance(logger: LoggerInterface, networkManager: NetworkManager, viemClientManager: IViemClientManager, deploymentManager: MessagingDeploymentManager, txWriter: ITxWriter): RelayerSetup;
    executeSetup(): Promise<void>;
    private ensureOperatorIsRegistered;
    private ensureOperatorDeposit;
    validateSetup(): Promise<boolean>;
    private waitForOperatorRegistration;
}
//# sourceMappingURL=RelayerSetup.d.ts.map