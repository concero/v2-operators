import { Address, Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { createCREJWT, CRERequestBody } from '../../utils';
import { RetryQueueService } from '../services';
import { Context } from '../types';

const MAX_STACK_SIZE = 10;

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    private requestVerificationStack: CREVerifierAdapter.Item[] = [];
    private confirmVerificationStack: { [messageId: string]: CREVerifierAdapter.Item } = {};
    private isFlushing = false;

    constructor(ctx: Context, reportJobQueue: RetryQueueService) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
        setInterval(() => this.flush(), 1000);
    }

    async requestVerification(payload: VerifierAdapter.Payload) {
        this.requestVerificationStack.push({
            messageId: payload.data.messageId,
            blockNumber: payload.blockNumber.toString(),
            srcChainSelector: payload.data.parsedReceipt.srcChainSelector,
            dstChainSelector: payload.data.parsedReceipt.dstChainSelector,
            messageReceipt: payload.data.messageReceipt,
            relayerLib: payload.data.relayerLib,
            validatorLibs: payload.data.validatorLibs,
        });

        if (this.requestVerificationStack.length > MAX_STACK_SIZE) {
            await this.flush();
        }
    }

    private async flush() {
        if (this.requestVerificationStack.length === 0) {
            return;
        }

        if (this.isFlushing) {
            return;
        }

        this.isFlushing = true;

        const batchSize = Math.min(MAX_STACK_SIZE, this.requestVerificationStack.length);
        const batch = Array.from(this.requestVerificationStack.slice(0, batchSize));

        const requestBody: CRERequestBody<CREVerifierAdapter.RequestVerify> = {
            jsonrpc: '2.0',
            id: Date.now().toString(),
            method: 'POST',
            params: {
                workflow: { workflowID: process.env.CRE_WORKFLOW_ID as string },
                input: { batch },
            },
        };
        const token = await createCREJWT(requestBody, process.env.CRE_REQUESTER_PRIVATE_KEY as Hex);
        await this.context.http.post(
            // @todo: fix types
            process.env.CRE_BASE_URL! as string,
            JSON.stringify(requestBody),
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            },
        );

        // @todo: move to cache
        for (const i of batch) {
            this.confirmVerificationStack[i.messageId] = i;
        }

        this.requestVerificationStack = this.requestVerificationStack.slice(batchSize);
        this.isFlushing = false;
    }

    async confirmVerification(payload: CREVerifierAdapter.ConfirmResponse) {
        for (const [messageId, reportItem] of Object.entries(payload)) {
            const batchItem = this.confirmVerificationStack[messageId];
            if (!batchItem) {
                throw new Error(`ConfirmVerify not found [messageId=${messageId}]`);
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
    }
}

export namespace CREVerifierAdapter {
    export type Item = RequestVerify.Item & {
        dstChainSelector: number;
        messageReceipt: Hex;
        validatorLibs: Address[];
        relayerLib: Address;
    };

    export type RequestVerify = {
        batch: RequestVerify.Item[];
    };
    export namespace RequestVerify {
        export type Item = {
            messageId: Hash;
            srcChainSelector: number;
            blockNumber: string;
        };
    }

    export type ConfirmResponse = Record<string, ConfirmResponse.Item>;
    export namespace ConfirmResponse {
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
