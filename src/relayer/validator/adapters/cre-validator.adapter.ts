import process from 'node:process';
import { encodeAbiParameters, encodePacked, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';
import axios, { AxiosError } from 'axios';

import { ArrayLib, createCREJWT, CRERequestBody } from '../../../utils';
import { Context, ValidatorType } from '../../types';
import { CRE, JobPayload, JobStatus } from '../../../types';

export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('CREValidatorAdapter', context);
    }

    async pumpPendingRequest() {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.CRE },
            { take: 40 },
        );

        if (jobs.length === 0) {
            return;
        }

        const batches = ArrayLib.toChunks(jobs, 2);

        for (const batch of batches) {
            try {
                const requestBody: CRERequestBody<CRE.Request> = {
                    jsonrpc: '2.0',
                    id: crypto.randomUUID(),
                    method: 'workflows.execute',
                    params: {
                        input: {
                            batch: jobs.map(i => {
                                return {
                                    messageId: i.messageId as Hex,
                                    blockNumber: i.srcBlockNumber,
                                    srcChainSelector: i.srcChainSelector,
                                };
                            }),
                        },
                        workflow: { workflowID: process.env.CRE_WORKFLOW_ID as string },
                    },
                };
                const token = await createCREJWT(
                    requestBody,
                    process.env.CRE_REQUESTER_PRIVATE_KEY as Hex,
                );
                await axios.post(
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
                await this.context.jobQueue.updateMany(
                    { id: { in: jobs.map(i => i.id) } },
                    { status: JobStatus.ProcessingConfirm },
                );
            } catch (e) {
                if (e instanceof AxiosError) {
                    this.logger.error(`Found error: ${JSON.stringify(e.response)}`);
                } else {
                    this.logger.error(`Error ${e}`);
                }
                this.logger.debug(`Failed CRE request ${e}`);
                await this.context.jobQueue.updateMany(
                    { id: { in: jobs.map(i => i.id) } },
                    { status: JobStatus.RequestFailed },
                );
            }
        }
    }

    async pumpFailedRequest() {
        const jobs = await this.context.jobQueue.getList(
            {
                OR: [
                    // failed
                    { status: JobStatus.RequestFailed, validatorType: ValidatorType.CRE },
                    // timeout
                    {
                        status: JobStatus.ProcessingRequest,
                        updatedAt: { lte: new Date(Date.now() - 5 * 60_000) },
                        validatorType: ValidatorType.CRE,
                        callbacksCount: { lt: 4 },
                        // no submit retry
                    },
                ],
            },
            { take: 100 },
        );

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { status: JobStatus.ProcessingRequest },
        );
    }

    async pumpPendingConfirm() {
        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.ProcessingConfirm,
                validatorType: ValidatorType.CRE,
                callbacksCount: { gte: 4 },
            },
            { take: 20 },
        );

        const promises = await Promise.allSettled(
            jobs.map(async i => {
                const parsedPayload = JSON.parse(i.payload) as JobPayload;

                const rawCallbacks = await this.context.dbClient.creCallback.findMany({
                    where: { messageId: i.messageId },
                });
                const callbacks = rawCallbacks.map(i => JSON.parse(i.payload)) as CRE.Response.Item[];
                const validations = await this.packCREValidations(callbacks);

                const dst = await this.submitMessage(parsedPayload, [validations]);
                await this.context.jobQueue.updateOne(
                    { id: i.id },
                    { dstBlockNumber: String(dst.blockNumber), dstTxHash: dst.hash },
                );
                return i.id;
            }),
        );
        const jobIds = promises.filter(i => i.status === 'fulfilled').map(i => i.value);
        const errors = promises.filter(i => i.status === 'rejected').map(i => i.reason);
        if (errors.length > 0) {
            this.logger.error(errors.join(';'));
        }

        await this.context.jobQueue.updateMany(
            { id: { in: jobIds } },
            { status: JobStatus.WaitingTxFinality },
        );
    }

    private async packCREValidations(creCallbacks: CRE.Response.Item[]) {
        const rawReport = creCallbacks[0].rawReport as Hex;
        const reportContext = creCallbacks[0].reportContext as Hex;

        const signatures = Array.from(
            new Set(
                creCallbacks.flatMap(item =>
                    item.signs.map(sign => {
                        const hex = sign.signature.startsWith('0x')
                            ? sign.signature
                            : `0x${sign.signature}`;
                        return hex as Hex;
                    }),
                ),
            ),
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
