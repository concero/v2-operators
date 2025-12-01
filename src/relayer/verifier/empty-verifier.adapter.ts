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

        const dstRouterAddress = this.context.messagingDeployment.getRouterByChainName(
            dstNetwork.name,
        );
        if (!dstRouterAddress) {
            throw new Error(`DstRouterAddress not found [chainName=${dstNetwork.name}]`);
        }
        const dstRelayerLib = this.context.messagingDeployment.getConceroRelayerLibByChainName(
            dstNetwork.name,
        );
        if (!dstRelayerLib) {
            throw new Error(`DstRelayerLib not found [chainName=${dstNetwork.name}]`);
        }

        await this.context.txWriter.callContract(dstNetwork, {
            address: dstRouterAddress,
            functionName: 'submitMessage',
            abi: this.context.config.contract.router,
            args: [payload.data.messageReceipt, [], payload.data.validatorLibs, dstRelayerLib],
        });

        this.logger.info(`submittedMessage on ${dstNetwork.name} ${payload.data.messageId}`);
    }
}
