import { Address, Hash, Hex, withTimeout } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';

import { JobPayload } from '../../../types';
import { ContextProvider } from '../../services';
import { Context } from '../../types';

export abstract class BaseValidatorAdapter extends ContextProvider {
    protected constructor(name: string, context: Context) {
        super(name, context);
    }

    protected async submitMessage(
        payload: JobPayload,
        validations: Hex[],
        validatorLibs: Address[],
    ): Promise<{ hash: Hash; blockNumber: bigint }> {
        const timeoutMs = 4000;

        const timeoutMessage =
            `submitMessage Timeout (messageId=${payload.data.messageId}, ` +
            `validatorLibs=[${validatorLibs.join(',')}],`;

        const timeoutError = new Error(timeoutMessage);

        try {
            return await withTimeout(
                async () => {
                    const dstChainSelector = payload.parsedReceipt.dstChainSelector;
                    const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
                        String(dstChainSelector),
                    );

                    const routerAddress =
                        this.context.deploymentManager.getRouterByChainSelector(dstChainSelector);
                    const relayerLib =
                        this.context.deploymentManager.getConceroRelayerLibByChainSelector(
                            dstChainSelector,
                        );

                    const receipt = await this.context.txWriter.callContract(dstNetwork, {
                        address: routerAddress,
                        functionName: 'submitMessage',
                        abi: this.context.config.routerContractAbi,
                        args: [payload.data.messageReceipt, validations, validatorLibs, relayerLib],
                    });

                    return { blockNumber: receipt.blockNumber, hash: receipt.transactionHash };
                },
                {
                    timeout: timeoutMs,
                    errorInstance: timeoutError,
                    signal: false,
                },
            );
        } catch (err) {
            if (err === timeoutError) this.logger.error(timeoutMessage);
            throw err;
        }
    }
}
