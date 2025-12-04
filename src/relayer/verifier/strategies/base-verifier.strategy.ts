import { Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { JobQueue } from '../../services';
import { ContextProvider } from '../../services/context.provider';
import { Context } from '../../types';

export abstract class BaseVerifierStrategy extends ContextProvider {
    protected readonly JobQueue: JobQueue;

    protected constructor(name: string, context: Context, reportJobQueue: JobQueue) {
        super(name, context);
        this.JobQueue = reportJobQueue;
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

        const routerAddress = this.context.deploymentManager.getRouterByChainName(dstNetwork.name);
        const relayerLib = this.context.deploymentManager.getConceroRelayerLibByChainName(
            dstNetwork.name,
        );
        const validatorLib = this.context.deploymentManager.getConceroValidatorLibByChainName(
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
