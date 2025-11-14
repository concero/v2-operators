import { encodeAbiParameters, keccak256 } from 'viem';
import { BaseVerifierAdapter } from './base-verifier.adapter';
import { ReportJobQueue } from './report-job-queue';
import { VerifierAdapter } from './types';

import { Context } from '../types';

export class CLFVerifierAdapter extends BaseVerifierAdapter implements VerifierAdapter {
    constructor(context: Context, reportJobQueue: ReportJobQueue) {
        super('CLFRelayerAdapter', context, reportJobQueue);
    }

    async requestMessageReport(payload: VerifierAdapter.Payload): Promise<void> {
        try {
            if (!payload.messageId || !payload || !payload.sender || !payload.blockNumber) {
                this.logger.error(`Missing required data in log`);
                return;
            }

            const encodedSrcChainData = encodeAbiParameters(
                [
                    {
                        type: 'tuple',
                        components: [
                            { name: 'blockNumber', type: 'uint256' },
                            { name: 'sender', type: 'address' },
                        ],
                    },
                ],
                [{ blockNumber: BigInt(payload.blockNumber), sender: payload.sender }],
            );

            await this.context.txWriter.callContract(this.context.verifierNetwork, {
                address: this.context.verifierAddress,
                abi: this.context.config.contract.verifier,
                functionName: 'requestMessageReport',
                args: [
                    payload.messageId,
                    keccak256(Buffer.from(payload.data)),
                    payload.chainSelector,
                    encodedSrcChainData,
                ],
                chain: this.context.verifierNetwork.viemChain,
            });

            this.logger.info(`Report requested, messageId: ${payload.messageId}`);
        } catch (error) {
            this.logger.error(
                `[${this.context.verifierNetwork.name}] Error requesting report for messageId ${payload.messageId || 'unknown'}: ${error}`,
            );
        } finally {
            await this.reportJobQueue.add(
                payload.messageId,
                this.context.verifierNetwork.name,
                payload,
                60,
            );
        }
    }
}
