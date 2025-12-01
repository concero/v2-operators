import { Address, encodeAbiParameters, encodePacked, Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { VerifierAdapter } from './types';

import { createCREJWT, CRERequestBody } from '../../utils';
import { RetryQueueService } from '../services';
import { Context } from '../types';

const MAX_STACK_SIZE = 10;

export class CREVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    private pendingVerifierRequestStack: CREVerifierAdapter.Item[] = [];
    private pendingVerifierConfirmStack: { [messageId: string]: CREVerifierAdapter.Item } = {};
    private verifierConfirmCallback: {
        [messageId: string]: CREVerifierAdapter.ConfirmResponse.Item[];
    } = {};
    private isFlushing = false;

    constructor(ctx: Context, reportJobQueue: RetryQueueService) {
        super('CREVerifierAdapter', ctx, reportJobQueue);
        setInterval(() => this.flush(), 1000);
        setInterval(() => this.processConfirmations(), 1000);
    }

    async requestVerification(payload: VerifierAdapter.Payload) {
        this.pendingVerifierRequestStack.push({
            messageId: payload.data.messageId,
            blockNumber: payload.blockNumber.toString(),
            srcChainSelector: payload.data.parsedReceipt.srcChainSelector,
            dstChainSelector: payload.data.parsedReceipt.dstChainSelector,
            messageReceipt: payload.data.messageReceipt,
            relayerLib: payload.data.relayerLib,
            validatorLibs: payload.data.validatorLibs,
        });

        if (this.pendingVerifierRequestStack.length > MAX_STACK_SIZE) {
            await this.flush();
        }
    }

    addConfirmationCallback(payload: CREVerifierAdapter.ConfirmResponse) {
        for (const [messageId, item] of Object.entries(payload)) {
            if (!this.verifierConfirmCallback[messageId]) {
                this.verifierConfirmCallback[messageId] = [item];
            } else {
                this.verifierConfirmCallback[messageId] = Array.from([
                    ...this.verifierConfirmCallback[messageId],
                    item,
                ]);
            }
            this.logger.debug(
                `Callbacks for messageId=${messageId} count is ${this.verifierConfirmCallback[messageId]?.length || 0}`,
            );
        }
    }

    private async flush() {
        if (this.pendingVerifierRequestStack.length === 0) {
            return;
        }

        if (this.isFlushing) {
            return;
        }

        try {
            this.isFlushing = true;

            const batchSize = Math.min(MAX_STACK_SIZE, this.pendingVerifierRequestStack.length);
            const batch = Array.from(this.pendingVerifierRequestStack.slice(0, batchSize));

            const requestBody: CRERequestBody<CREVerifierAdapter.RequestVerify> = {
                jsonrpc: '2.0',
                id: Date.now().toString(),
                method: 'workflows.execute',
                params: {
                    input: {
                        batch: batch.map(i => ({
                            messageId: i.messageId,
                            blockNumber: i.blockNumber.toString(),
                            srcChainSelector: i.srcChainSelector,
                        })),
                    },
                    workflow: { workflowID: process.env.CRE_WORKFLOW_ID as string },
                },
            };
            const token = await createCREJWT(
                requestBody,
                process.env.CRE_REQUESTER_PRIVATE_KEY as Hex,
            );
            await this.context.http.post(
                // @todo: fix types
                process.env.CRE_BASE_URL as string,
                requestBody,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            // @todo: move to cache
            for (const i of batch) {
                this.pendingVerifierConfirmStack[i.messageId] = i;
            }
            this.pendingVerifierRequestStack = this.pendingVerifierRequestStack.slice(batchSize);
        } catch (e) {
            throw e;
        } finally {
            this.isFlushing = false;
        }
    }

    private async processConfirmations() {
        const messagesToConfirm = Object.entries(this.verifierConfirmCallback)
            .map(([messageId, verifierResponses]) => {
                this.logger.debug(
                    `For messageId=${messageId} got responses count ${verifierResponses.length}`,
                );
                if (verifierResponses.length !== 10) {
                    return null;
                }
                const item = this.pendingVerifierConfirmStack[messageId];
                this.logger.debug(
                    `For messageId=${messageId} found item ${item ? 'true' : 'false'}`,
                );
                if (!item) {
                    return null;
                }

                return { item, confirmations: verifierResponses, messageId };
            })
            .filter(Boolean);

        for (const message of messagesToConfirm) {
            if (!message) {
                continue;
            }

            const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
                String(message.item.dstChainSelector),
            );
            if (!dstNetwork) {
                this.logger.error(
                    `DstNetwork not found [chainSelector=${message.item.dstChainSelector}]`,
                );
                return;
            }

            const routerAddress = this.context.messagingDeployment.getRouterByChainName(
                dstNetwork.name,
            );
            if (!routerAddress) {
                this.logger.error(
                    `DstRouterAddress not found [chainSelector=${message.item.dstChainSelector}]`,
                );
                return;
            }

            const confirmations = this.packConfirmations(message.confirmations);
            await this.context.txWriter.callContract(dstNetwork, {
                address: routerAddress,
                functionName: 'submitMessage',
                abi: this.context.config.contract.router,
                args: [
                    message.item.messageReceipt,
                    confirmations,
                    message.item.validatorLibs,
                    message.item.relayerLib,
                ],
            });
            delete this.verifierConfirmCallback[message.messageId];
            delete this.pendingVerifierConfirmStack[message.messageId];
        }
    }

    private packConfirmations(creCallbacks: CREVerifierAdapter.ConfirmResponse.Item[]): Hex {
        const rawReport = creCallbacks[0].rawReport as Hex;
        const reportContext = creCallbacks[0].reportContext as Hex;

        const signatures = Array.from(
            new Set(creCallbacks.flatMap(item => item.signs.map(sign => sign.signature))),
        );

        this.logger.info(`Got signatures: ${signatures.join(', ')}`);
        const encodedSignatures = encodeAbiParameters([{ type: 'bytes[]' }], [signatures as Hex[]]);
        this.logger.info(`Encoded signatures: ${encodedSignatures}`);

        return encodePacked(
            ['bytes', 'bytes', 'bytes'],
            [rawReport, reportContext, encodedSignatures],
        );
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
            }[];
        };
    }
}
