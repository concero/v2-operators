import { Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { RetryQueueService } from '../services';
import { ContextProvider } from '../services/context.provider';
import { Context } from '../types';

export abstract class BaseVerifierAdapter extends ContextProvider {
    protected readonly reportJobQueue: RetryQueueService;

    protected constructor(name: string, context: Context, reportJobQueue: RetryQueueService) {
        super(name, context);
        this.reportJobQueue = reportJobQueue;
    }

    protected async submitMessage(
        dstChainSelector: number,
        messageReceipt: Hex,
        confirmations: Hex[],
    ): Promise<void> {
        const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
            String(dstChainSelector),
        );
        if (!dstNetwork) {
            this.logger.error(`DstNetwork not found [chainSelector=${dstChainSelector}]`);
            return;
        }

        const routerAddress = this.context.messagingDeployment.getRouterByChainName(
            dstNetwork.name,
        );
        const relayerLib = this.context.messagingDeployment.getConceroRelayerLibByChainName(
            dstNetwork.name,
        );
        const validatorLib = this.context.messagingDeployment.getConceroValidatorLibByChainName(
            dstNetwork.name,
        );

        await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.contract.router,
            args: [messageReceipt, confirmations, [validatorLib], relayerLib],
        });
    }
}
