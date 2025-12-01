import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { RetryQueueService } from '../services';
import { Context } from '../types';

export class EmptyVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: RetryQueueService) {
        super('EmptyRelayerAdapter', context, reportJobQueue);
    }

    async requestVerification(payload: VerifierAdapter.Payload): Promise<void> {
        const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
            String(payload.data.parsedReceipt.dstChainSelector),
        );

        if (!dstNetwork) {
            throw new Error(
                `DstNetwork not found [chainSelector=${payload.data.parsedReceipt.dstChainSelector}]`,
            );
        }

        const routerAddress = this.context.messagingDeployment.getRouterByChainName(
            dstNetwork.name,
        );
        if (!routerAddress) {
            throw new Error(
                `DstRouterAddress not found [chainSelector=${payload.data.parsedReceipt.dstChainSelector}]`,
            );
        }

        await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.contract.router,
            args: [
                payload.data.messageReceipt,
                [],
                payload.data.validatorLibs,
                payload.data.relayerLib,
            ],
        });

        this.logger.info(`submittedMessage on ${dstNetwork.name} ${payload.data.messageId}`);
    }
}
