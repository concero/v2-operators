import { Address, encodeAbiParameters, encodePacked, Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { requiredCallbacksCount } from './adapters';
import { BaseValidatorService } from './base-validator.service';
import { Job } from '@prisma/client';

import { CRE, JobPayload, JobStatus } from '../../types';
import { Context, ValidatorType } from '../types';

export class SubmitQueueProcessor extends BaseValidatorService {
    private isProcessing = false;

    constructor(context: Context) {
        super('SubmitQueueProcessor', context);
    }

    async pump(options: { maxTxPerPump: number; maxTxPerChain: number }) {
        if (this.isProcessing) {
            return;
        }
        const startTimestamp = Date.now();

        try {
            this.isProcessing = true;

            // @todo: add custom profiling decorator

            const jobs = await this.context.dbClient.$queryRaw<Job[]>`
                    WITH ranked AS (
                        SELECT j.id,
                               ROW_NUMBER() OVER (PARTITION BY j."dstChainSelector" ORDER BY j."lastSubmitAt" ASC) AS rn
                        FROM job j
                        WHERE j.status = ${JobStatus.PendingSubmit}
                          AND j."callbacksCount" = ${requiredCallbacksCount}
                          AND j."submitPlannedTo" < now()
                    )
                    SELECT j.*
                    FROM job j
                             JOIN (
                        SELECT id
                        FROM ranked
                        WHERE rn <= ${options.maxTxPerChain}
                        ORDER BY rn
                            LIMIT ${options.maxTxPerPump}
                    ) capped ON j.id = capped.id;
            `;

            this.logger.info(`pump jobs.length=${jobs.length}`);
            if (!jobs.length) {
                return;
            }

            // @todo: support bulkWrite in TxWriter to support batches by one chain & move to batches
            const promises = jobs.map(async job => {
                const jobPayload = JSON.parse(job.payload) as JobPayload;

                try {
                    this.logger.info(
                        `Submitting message ${job.messageId} to chain ${job.dstChainSelector}`,
                    );

                    const creCallback = await this.context.dbClient.creCallback.findFirst({
                        where: { messageId: job.messageId },
                    });
                    if (!creCallback) {
                        throw new Error(
                            `Cannot find creCallback for message with id ${job.messageId}`,
                        );
                    }
                    const creResponse = JSON.parse(creCallback.payload) as CRE.Response;

                    const validations = this.extractJobValidations(
                        job.validatorType as ValidatorType,
                        job.messageId as Hex,
                        creResponse,
                    );
                    const validatorLibs = this.extractJobValidatorLibs(
                        job.validatorType as ValidatorType,
                        job.dstChainSelector,
                    );

                    const dst = await this.submitMessage(
                        job.dstChainSelector,
                        jobPayload.data.messageReceipt,
                        validations,
                        validatorLibs,
                    );

                    return { jobId: job.id, type: 'success', dst };
                } catch (e) {
                    this.logger.error(
                        `pump Message (id=${job.messageId}, jobId=${job.id}) submit failed: ${e}`,
                    );
                    return { jobId: job.id, type: 'failed', attempts: job.submitAttempts };
                }
            });

            const results = await Promise.all(promises);
            const successResults = results.filter(i => i.type === 'success');
            const failedResults = results.filter(i => i.type === 'failed');

            await this.context.dbClient.$transaction(async client => {
                const successPromises = successResults.map(i => {
                    return client.job.update({
                        where: { id: i.jobId },
                        data: {
                            status: JobStatus.WaitingDstFinality,
                            submitAttempts: 0,
                            submitPlannedTo: null,
                            lastSubmitAt: new Date(),
                            dstBlockNumber: String(i?.dst?.blockNumber),
                            dstTxHash: String(i?.dst?.hash),
                        },
                    });
                });
                const failedPromises = failedResults.map(i => {
                    const submitPlannedTo = this.calculateNextPlannedTo((i.attempts as number) + 1);
                    this.logger.warn(
                        `Submit failed jobId=${i.jobId}, attempt=${(i?.attempts || 0) + 1}, nextTryIn=${Math.round((submitPlannedTo.getTime() - Date.now()) / 1000)}s`,
                    );
                    return client.job.update({
                        where: { id: i.jobId },
                        data: {
                            submitPlannedTo,
                            submitAttempts: { increment: 1 },
                        },
                    });
                });
                const totalPromises = successPromises.concat(failedPromises);
                await Promise.all(totalPromises);
            });
        } catch (e) {
            this.logger.info(`pump failed: ${e}`);
        } finally {
            this.logger.info(`pump took: ${(Date.now() - startTimestamp) / 1000}s`);
            this.isProcessing = false;
        }
    }

    private async submitMessage(
        dstChainSelector: number,
        messageReceipt: Hex,
        validations: Hex[],
        validatorLibs: Address[],
    ): Promise<{ hash: Hash; blockNumber: bigint }> {
        const dstNetwork: ConceroNetwork = this.context.network.getNetworkBySelector(
            String(dstChainSelector),
        );

        const routerAddress =
            this.context.deploymentManager.getRouterByChainSelector(dstChainSelector);
        const relayerLib =
            this.context.deploymentManager.getConceroRelayerLibByChainSelector(dstChainSelector);

        const receipt = await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.routerContractAbi,
            args: [messageReceipt, validations, validatorLibs, relayerLib],
        });

        return { blockNumber: receipt.blockNumber, hash: receipt.transactionHash };
    }

    private extractJobValidatorLibs(
        validatorType: ValidatorType,
        dstChainSelector: number,
    ): Address[] {
        switch (validatorType) {
            case ValidatorType.CRE: {
                return [
                    this.context.deploymentManager.getConceroValidatorLibByChainSelector(
                        dstChainSelector,
                    ),
                ];
            }
            case ValidatorType.Empty: {
                return [];
            }
        }
    }

    private extractJobValidations(
        validatorType: ValidatorType,
        messageId: CRE.MessageId,
        creResponse: CRE.Response,
    ): Hex[] {
        switch (validatorType) {
            case ValidatorType.CRE: {
                return [this.packCREResponseToValidation(messageId, creResponse)];
            }
            case ValidatorType.Empty: {
                return [];
            }
        }
    }

    private packCREResponseToValidation(messageId: CRE.MessageId, creResponse: CRE.Response): Hex {
        const rawReport = creResponse.report.rawReport as Hex;
        const reportContext = creResponse.report.reportContext as Hex;
        const proofs = creResponse.proofs[messageId];
        if (!proofs) {
            throw new Error(`Missing merkle proof for messageId=${messageId}`);
        }

        const signatures = Array.from(
            new Set(
                creResponse.report.signs.map(sign => {
                    const hex = sign.signature.startsWith('0x')
                        ? sign.signature
                        : `0x${sign.signature}`;
                    return hex as Hex;
                }),
            ),
        );

        const encodedSignaturesAndProof = encodeAbiParameters(
            [{ type: 'bytes[]' }, { type: 'bytes32[]' }],
            [signatures, proofs],
        );

        return encodePacked(
            ['bytes', 'bytes', 'bytes'],
            [rawReport, reportContext, encodedSignaturesAndProof],
        );
    }
}
