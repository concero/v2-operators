import { Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { ContextProvider } from '../../services/context.provider';
import { Context } from '../../types';

export abstract class BaseVerifierStrategy extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected async submitMessage(
        dstChainSelector: number,
        messageReceipt: Hex,
        validations: Hex[],
    ): Promise<void> {
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
            args: [messageReceipt, validations, [validatorLib], relayerLib],
        });
    }
}
