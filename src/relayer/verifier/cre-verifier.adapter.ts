import { Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { RetryQueueService } from '../services';
import { Context } from '../types';

const MAX_STACK_SIZE = 10;

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    private stack: (CREVerifierAdapter.Request.Item & {
        dstChainSelector: number;
        messageReceipt: Hex;
    })[] = [];
    private isFlushing = false;

    constructor(ctx: Context, reportJobQueue: RetryQueueService) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
        setInterval(() => this.flush(), 1000);
    }

    async process(payload: VerifierAdapter.Payload) {
        this.stack.push({
            messageId: payload.data.messageId,
            blockNumber: payload.blockNumber.toString(),
            srcChainSelector: payload.data.parsedReceipt.srcChainSelector,
            dstChainSelector: payload.data.parsedReceipt.dstChainSelector,
            messageReceipt: payload.data.messageReceipt,
        });

        if (this.stack.length > MAX_STACK_SIZE) {
            await this.flush();
        }
    }

    private async flush() {
        this.isFlushing = true;
        const batch = Array.from(this.stack);
        const result = await this.context.http.post<CREVerifierAdapter.Response>(
            'https://google.com',
            {
                batch,
            },
        );

        for (let i = 0; i < batch.length; i++) {
            const batchItem = batch[i];
            const reportItem = result.batch[i];

            const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
                batchItem.srcChainSelector,
            );
            if (!dstNetwork) {
                throw new Error(
                    `DstNetwork not found [chainSelector=${batchItem.dstChainSelector}]`,
                );
            }

            const routerAddress = dstNetwork.addresses?.conceroRouter;
            if (!routerAddress) {
                throw new Error(
                    `DstRouterAddress not found [chainSelector=${batchItem.dstChainSelector}]`,
                );
            }

            await this.context.txWriter.callContract(dstNetwork, {
                address: routerAddress,
                functionName: 'submitMessage',
                abi: this.context.config.contract.router,
                args: [
                    batchItem.messageReceipt,
                    reportItem ? [Buffer.from(JSON.stringify(reportItem)).toString('hex')] : [],
                    [],
                    'unknown',
                ],
            });
        }
        this.isFlushing = false;
    }
}

export namespace CREVerifierAdapter {
    export type Request = {
        batch: Request.Item[];
    };
    export namespace Request {
        export type Item = {
            messageId: Hash;
            srcChainSelector: number;
            blockNumber: string;
        };
    }

    export type Response = {
        batch: Response.Item[];
    };
    export namespace Response {
        export type Item = {
            rawReport: string;
            reportContext: string;
            signs: {
                signature: string;
                signerId: number;
            };
        };
    }
}
