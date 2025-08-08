import { Logger, NetworkManager, TxMonitor } from '@concero/operator-utils';
import { TransactionInfo } from '@concero/operator-utils';
import { v4 as uuidv4 } from 'uuid';

import { ConceroNetwork } from '../../types/ConceroNetwork';
import { DecodedLog } from '../../types/DecodedLog';
import { processMessageReportRequest } from '../businessLogic/requestCLFMessageReport';

export class MessageReportFinalityService {
    private static instance: MessageReportFinalityService;
    private logger: ReturnType<typeof Logger.prototype.getLogger>;
    private txMonitor: TxMonitor;
    private networkManager: NetworkManager;

    private constructor() {
        this.logger = Logger.getInstance().getLogger('MessageReportFinalityService');
        this.txMonitor = TxMonitor.getInstance();
        this.networkManager = NetworkManager.getInstance();
    }

    public static getInstance(): MessageReportFinalityService {
        if (!MessageReportFinalityService.instance) {
            MessageReportFinalityService.instance = new MessageReportFinalityService();
        }
        return MessageReportFinalityService.instance;
    }

    public addTransaction(
        decodedLog: DecodedLog,
        network: ConceroNetwork,
        verifierNetwork: ConceroNetwork,
        verifierAddress: string,
    ): void {
        const txHash = decodedLog.transactionHash!;
        const blockNumber = Number(decodedLog.blockNumber!);

        this.logger.debug(`Adding transaction ${txHash} for finality tracking`);

        const txInfo: TransactionInfo = {
            id: uuidv4(),
            txHash: txHash,
            chainName: network.name,
            submittedAt: Date.now(),
            submissionBlock: BigInt(blockNumber),
            status: 'pending',
        };

        this.logger.debug(`Starting finality watch for tx ${txHash} on ${network.name}`);

        this.txMonitor.ensureTxFinality(
            txInfo,
            this.createFinalityCallback(decodedLog, network, verifierNetwork, verifierAddress),
        );
    }

    private createFinalityCallback(
        decodedLog: DecodedLog,
        network: ConceroNetwork,
        verifierNetwork: ConceroNetwork,
        verifierAddress: string,
    ): (txInfo: TransactionInfo, isFinalized: boolean) => void {
        const txHash = decodedLog.transactionHash!;
        const chainSelector = network.chainSelector;

        return (txInfo: TransactionInfo, isFinalized: boolean): void => {
            if (isFinalized) {
                this.logger.debug(
                    `Transaction ${txHash} finalized, processing message report request`,
                );

                this.executeMessageReportRequest(
                    decodedLog,
                    chainSelector,
                    verifierNetwork,
                    verifierAddress,
                ).catch(error => {
                    this.logger.error(`Failed to process message report for tx ${txHash}:`, error);
                });
            } else {
                this.logger.error(
                    `Transaction ${txHash} failed to reach finality on ${network.name}`,
                );
            }
        };
    }

    private async executeMessageReportRequest(
        decodedLog: DecodedLog,
        chainSelector: string,
        verifierNetwork: ConceroNetwork,
        verifierAddress: string,
    ): Promise<void> {
        await processMessageReportRequest(
            decodedLog,
            chainSelector,
            this.logger,
            this.networkManager,
            verifierNetwork,
            verifierAddress,
        );
    }
}
