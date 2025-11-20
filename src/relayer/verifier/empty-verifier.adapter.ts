import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { RetryQueueService } from '../services';
import { Context } from '../types';

export class EmptyVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: RetryQueueService) {
        super('EmptyRelayerAdapter', context, reportJobQueue);
    }

    async process(payload: VerifierAdapter.Payload): Promise<void> {
        const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
            payload.data.parsedReceipt.dstChainSelector,
        );
        if (!dstNetwork) {
            throw new Error(
                `DstNetwork not found [chainSelector=${payload.data.parsedReceipt.dstChainSelector}]`,
            );
        }

        const routerAddress = dstNetwork.addresses?.conceroRouter;
        if (!routerAddress) {
            throw new Error(
                `DstRouterAddress not found [chainSelector=${payload.data.parsedReceipt.dstChainSelector}]`,
            );
        }

        await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.contract.router,
            args: [payload.data.messageReceipt, [], [], 'unknown'],
        });

        this.logger.debug(`submittedMessage on ${dstNetwork.name} ${payload.data.messageId}`);
    }
}
