import { Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { JobPayload } from '../../../types';
import { ContextProvider } from '../../services';
import { Context } from '../../types';

const SUBMIT_MESSAGE_ROUTER_GAS_LIMIT_OVERHEAD = 70_000n;
const SUBMIT_MESSAGE_RELAYER_LIB_GAS_LIMIT_OVERHEAD = 70_000n;

export abstract class BaseValidatorAdapter extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected async submitMessage(
        payload: JobPayload,
        validations: Hex[],
    ): Promise<{ hash: Hash; blockNumber: bigint }> {
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

        const receipt = await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.routerContractAbi,
            args: [payload.data.messageReceipt, validations, [validatorLib], relayerLib],
            gas:
                BigInt(payload.parsedReceipt.dstChainData.gasLimit!) +
                SUBMIT_MESSAGE_ROUTER_GAS_LIMIT_OVERHEAD +
                SUBMIT_MESSAGE_RELAYER_LIB_GAS_LIMIT_OVERHEAD,
        });

        return { blockNumber: receipt.blockNumber, hash: receipt.transactionHash };
    }
}
