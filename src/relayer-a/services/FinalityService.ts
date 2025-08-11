import { ITxMonitor, LoggerInterface } from '@concero/operator-utils';
import { TransactionInfo } from '@concero/operator-utils';
import { v4 as uuidv4 } from 'uuid';

export interface FinalityContext<T = any> {
    data: T;
    metadata: Record<string, any>;
}

export interface FinalityHandler<T = any> {
    onFinalized(context: FinalityContext<T>): Promise<void>;
    onFailed(context: FinalityContext<T>): Promise<void>;
}

export class FinalityService {
    private static instance: FinalityService | undefined;
    private logger: LoggerInterface;
    private txMonitor: ITxMonitor;

    private constructor(logger: LoggerInterface, txMonitor: ITxMonitor) {
        this.logger = logger;
        this.txMonitor = txMonitor;
    }

    public static getInstance(): FinalityService {
        if (!FinalityService.instance) {
            throw new Error('FinalityService is not initialized. Call createInstance() first.');
        }
        return FinalityService.instance;
    }

    public static createInstance(logger: LoggerInterface, txMonitor: ITxMonitor): FinalityService {
        if (!FinalityService.instance) {
            FinalityService.instance = new FinalityService(logger, txMonitor);
        }
        return FinalityService.instance;
    }

    public addTransaction<T>(
        txHash: string,
        chainName: string,
        blockNumber: bigint,
        context: FinalityContext<T>,
        handler: FinalityHandler<T>,
    ): void {
        this.logger.debug(`Adding transaction ${txHash} for finality tracking on ${chainName}`);

        const txInfo: TransactionInfo = {
            id: uuidv4(),
            txHash,
            chainName,
            submittedAt: Date.now(),
            submissionBlock: blockNumber,
            status: 'pending',
        };

        this.logger.debug(`Starting finality watch for tx ${txHash} on ${chainName}`);

        this.txMonitor.ensureTxFinality(txInfo, this.createFinalityCallback(context, handler));
    }

    private createFinalityCallback<T>(
        context: FinalityContext<T>,
        handler: FinalityHandler<T>,
    ): (txInfo: TransactionInfo, isFinalized: boolean) => void {
        return async (txInfo: TransactionInfo, isFinalized: boolean): Promise<void> => {
            if (isFinalized) {
                this.logger.debug(`Transaction ${txInfo.txHash} finalized, executing handler`);

                try {
                    await handler.onFinalized(context);
                } catch (error) {
                    this.logger.error(
                        `Failed to handle finalized transaction ${txInfo.txHash}:`,
                        error,
                    );
                }
            } else {
                this.logger.error(
                    `Transaction ${txInfo.txHash} failed to reach finality on ${txInfo.chainName}`,
                );

                try {
                    await handler.onFailed(context);
                } catch (error) {
                    this.logger.error(
                        `Failed to handle failed transaction ${txInfo.txHash}:`,
                        error,
                    );
                }
            }
        };
    }
}
