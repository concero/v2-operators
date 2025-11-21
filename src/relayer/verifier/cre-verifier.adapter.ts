import { Address, Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { createCREJWT, CRERequestBody } from '../../utils';
import { RetryQueueService } from '../services';
import { Context } from '../types';

const MAX_STACK_SIZE = 10;

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    private stack: (CREVerifierAdapter.Request.Item & {
        dstChainSelector: number;
        messageReceipt: Hex;
        validatorLibs: Address[];
        relayerLib: Address;
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
            relayerLib: payload.data.relayerLib,
            validatorLibs: payload.data.validatorLibs,
        });

        if (this.stack.length > MAX_STACK_SIZE) {
            await this.flush();
        }
    }

    private async flush() {
        if (this.isFlushing) {
            return;
        }

        this.isFlushing = true;

        const batch = Array.from(this.stack);
        const creRequestBody: CRERequestBody<CREVerifierAdapter.Request> = {
            jsonrpc: '2.0',
            id: crypto.randomUUID(),
            method: 'POST',
            params: {
                workflow: { workflowID: process.env.CRE_WORKFLOW_ID as string },
                input: { batch },
            },
        };
        const token = await createCREJWT(
            creRequestBody,
            process.env.CRE_REQUESTER_PRIVATE_KEY as Hex,
        );
        const result = await this.context.http.post<CREVerifierAdapter.Response>(
            // @todo: fix types
            process.env.CRE_BASE_URL! as string,
            creRequestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        for (const [messageId, reportItem] of Object.entries(result)) {
            const batchItem = batch.find(i => i.messageId === messageId);
            if (!batchItem) {
                throw new Error(`BatchItem not found [messageId=${messageId}]`);
            }

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
                    batchItem.validatorLibs,
                    batchItem.relayerLib,
                ],
            });
        }

        this.stack = [];
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

    export type Response = Record<string, Response.Item>;
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
