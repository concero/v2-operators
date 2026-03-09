import { Address, encodeAbiParameters, encodePacked, Hash, Hex } from 'viem';
import { ConceroNetwork } from '@concero/operator-utils';
import { requiredCallbacksCount } from './adapters';
import { BaseValidatorService } from './base-validator.service';
import { Job } from '@prisma/client';


import { relayerLibGasLimits } from '../../constants/relayerLibGasLimits';
import { CRE, JobPayload, JobStatus } from '../../types';
import { MessagingCodec } from '../../utils';
import { Context, ValidatorType } from '../types';
import decodeInternalValidatorConfig = MessagingCodec.decodeInternalValidatorConfig;

const MAX_PROMISES_SLOTS = 30;

export class SubmitQueueProcessor extends BaseValidatorService {
    private usedSlots: number = 0;
    private isPumping = false;

    constructor(context: Context) {
        super('SubmitQueueProcessor', context);
    }

    async pump(options: { maxTxPerPump: number; maxTxPerChain: number }) {
        if (this.isPumping) {
            return;
        }

        this.isPumping = true;
        const availableSlots = MAX_PROMISES_SLOTS - this.usedSlots;
        if (availableSlots <= 0) {
            return;
        }

        const startTimestamp = Date.now();

        try {
            // @todo: add custom profiling decorator

            const jobs = await this.context.dbClient.$transaction(async client => {
                await client.job.updateMany({
                    where: {
                        status: JobStatus.ProcessingSubmit,
                        updatedAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
                    },
                    data: {
                        status: JobStatus.PendingSubmit,
                        submitPlannedTo: new Date(),
                        submitAttempts: 0,
                    },
                });

                return client.$queryRaw<Job[]>`
                    WITH ranked AS (
                        SELECT j.id,
                               j."dstChainSelector",
                               ROW_NUMBER() OVER (PARTITION BY j."dstChainSelector" ORDER BY j."lastSubmitAt" ASC) AS rn
                        FROM job j
                        WHERE j.status = ${JobStatus.PendingSubmit}
                          AND j."callbacksCount" = ${requiredCallbacksCount}
                          AND (j."submitPlannedTo" < now() OR j."submitPlannedTo" IS NULL)
                    )
                    UPDATE job j
                    SET status = ${JobStatus.ProcessingSubmit}
                        FROM (
                SELECT id
                FROM ranked
                WHERE rn <= ${options.maxTxPerChain}  -- per-chain limit
                        ORDER BY rn
                        LIMIT ${Math.max(0, Math.min(availableSlots, options.maxTxPerPump))} -- global + tick limit
                        ) capped 
                    WHERE j.id = capped.id
                        RETURNING j.*;
                `;
            });

            this.logger.info(`pump jobs.length=${jobs.length}`);
            if (!jobs.length) {
                return;
            }

            // @todo: support bulkWrite in TxWriter to support batches by one chain & move to batches
            this.usedSlots += jobs.length;
            const promises = jobs.map(async job => this.processJob(job));
            await Promise.all(promises);
            this.usedSlots -= jobs.length;
        } catch (e) {
            this.logger.info(`pump failed: ${e}`);
        } finally {
            this.isPumping = false;
            this.logger.info(`pump took: ${(Date.now() - startTimestamp) / 1000}s`);
        }
    }

    private async processJob(job: Job): Promise<void> {
        try {
            this.logger.info(
                `pump Job (id=${job.id},messageId=${job.messageId}) processing to Chain (selector${job.dstChainSelector})}`,
            );

            const jobPayload = JSON.parse(job.payload) as JobPayload;

            const creCallback = await this.context.dbClient.creCallback.findFirst({
                where: { messageId: job.messageId },
            });
            if (!creCallback) {
                throw new Error(`CreCallback not found by messageId="${job.messageId}"`);
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

            const dstReceipt = await this.submitMessage(
                job.dstChainSelector,
                jobPayload.data.messageReceipt,
                validations,
                validatorLibs,
            );
            this.logger.info(
                `pump Job (id=${job.id},messageId=${job.messageId}) succeeded: Receipt (txHash=${dstReceipt.hash},block=${String(dstReceipt.blockNumber)}`,
            );

            this.context.dbClient.job.update({
                where: { id: job.id },
                data: {
                    status: JobStatus.WaitingDstFinality,
                    submitAttempts: 0,
                    submitPlannedTo: null,
                    lastSubmitAt: new Date(),
                    dstBlockNumber: String(dstReceipt?.blockNumber),
                    dstTxHash: dstReceipt.hash,
                },
            });
        } catch (e) {
            const submitPlannedTo = this.calculateNextPlannedTo(job.submitAttempts + 1);
            await this.context.dbClient.job.update({
                where: { id: job.id },
                data: {
                    submitPlannedTo,
                    status: JobStatus.PendingSubmit,
                    submitAttempts: { increment: 1 },
                },
            });
            this.logger.info(
                `pump Job (id=${job.id},messageId=${job.messageId}) failed: ${e}, SubmitRetry (attempt=${job.submitAttempts},scheduledTo=${submitPlannedTo})`,
            );
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

        const gasLimit = this.calculateGasLimit(messageReceipt);

        const receipt = await this.context.txWriter.callContract(dstNetwork, {
            address: routerAddress,
            functionName: 'submitMessage',
            abi: this.context.config.routerContractAbi,
            args: [messageReceipt, validations, validatorLibs, relayerLib],
            gas: gasLimit,
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

    private calculateGasLimit(messageReceipt: Hex) {
        const decodedReceipt = MessagingCodec.decodeReceipt(messageReceipt);

        const validatorGasLimit = decodeInternalValidatorConfig(
            decodedReceipt.internalValidatorConfigs[0],
        );
        const relayerGasLimitOverhead =
            relayerLibGasLimits[decodedReceipt.dstChainSelector] ?? 120_000n;

        return (
            validatorGasLimit +
            relayerGasLimitOverhead +
            BigInt(decodedReceipt.dstChainData.gasLimit!)
        );
    }
}
