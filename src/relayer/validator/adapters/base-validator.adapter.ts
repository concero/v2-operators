import { Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../../services/context.provider';
import { Context, JobPayload } from '../../types';

export abstract class BaseValidatorAdapter extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected async submitMessage(payload: JobPayload, validations: Hex[]): Promise<void> {
        const dstChainSelector = payload.parsedReceipt.dstChainSelector;
        const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
            String(dstChainSelector),
        );

        const routerAddress =
            this.context.deploymentManager.getRouterByChainSelector(dstChainSelector);
        const relayerLib =
            this.context.deploymentManager.getConceroRelayerLibByChainSelector(dstChainSelector);
        const validatorLib =
            this.context.deploymentManager.getConceroValidatorLibByChainSelector(dstChainSelector);

        await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.contract.router,
            args: [payload.data.messageReceipt, validations, [validatorLib], relayerLib],
        });
    }
}
