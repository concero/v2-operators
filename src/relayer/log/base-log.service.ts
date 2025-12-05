import { BlockManager, ConceroNetwork } from '@concero/operator-utils';

import { DecodedLog } from '../../types';
import { ContextProvider } from '../services/context.provider';
import { Context, DecodedMessageLogReceipt, JobStatus, MessageSentLogData } from '../types';
import { VerifierModule, VerifierType } from '../verifier';

export abstract class BaseLogService extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected forEachActiveNetwork(
        handler: (network: ConceroNetwork, blockManager: BlockManager) => Promise<void> | void,
    ): void {
        const activeNetworks: ConceroNetwork[] = this.context.network.getActiveNetworks();
        this.logger.debug(
            `Got ${activeNetworks.length} active networks: ${activeNetworks.map(i => i.name).join(', ')}`,
        );

        for (const network of activeNetworks) {
            const blockManager = this.context.blockRegistry.getBlockManager(network.name);

            if (!blockManager) {
                this.logger.warn(
                    `No block manager available for ${network.name}, skipping event setup`,
                );
                continue;
            }

            handler(network, blockManager);
        }
    }

    protected async requestVerification(
        parsedLog: DecodedLog<MessageSentLogData>,
        parsedReceipt: DecodedMessageLogReceipt,
        verifierType: VerifierType,
    ): Promise<void> {
        const payload: VerifierModule.Request.Payload = {
            ...parsedLog,
            data: {
                ...parsedLog.data,
                parsedReceipt,
            },
            type: verifierType,
        };

        await this.context.jobQueue.add(
            parsedLog.data.messageId,
            payload,
            JobStatus.ProcessingRequest,
        );
        this.context.eventBus.requestVerification(payload);
    }
}
