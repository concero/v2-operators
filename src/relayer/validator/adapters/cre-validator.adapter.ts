import process from 'node:process';
import { encodeAbiParameters, encodePacked, Hex } from 'viem';
import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';
import axios, { AxiosError } from 'axios';

import { createCREJWT, CRERequestBody } from '../../../utils';
import { Context, CRE, JobPayload, JobStatus, ValidatorType } from '../../types';

export class CREValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('CREValidatorAdapter', context);
    }

    async pumpPendingRequest() {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.CRE },
            { take: 2 },
        );
        try {
            const requestBody: CRERequestBody<CRE.Request> = {
                jsonrpc: '2.0',
                id: Date.now().toString(),
                method: 'workflows.execute',
                params: {
                    input: {
                        batch: jobs.map(i => {
                            const payload = JSON.parse(i.payload) as JobPayload;
                            return {
                                messageId: i.messageId as Hex,
                                blockNumber: i.srcBlockNumber,
                                srcChainSelector: payload.parsedReceipt.srcChainSelector,
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
            { status: JobStatus.ProcessingConfirm, validatorType: ValidatorType.CRE },
            { take: 20 },
        );

        await Promise.all(
            jobs.map(async i => {
                const parsedPayload = JSON.parse(i.payload) as JobPayload;
                if (!Array.isArray(parsedPayload.callbacks)) {
                    this.logger.debug(`Job [id=${i.id}] due to none callbacks`);
                    return;
                }

                if (parsedPayload.callbacks.length < 10) {
                    this.logger.debug(
                        `Job [id=${i.id}] due to callbacks count=${parsedPayload.callbacks}`,
                    );
                    return;
                }

                const validations = await this.packCREValidations(parsedPayload.callbacks);
                await this.submitMessage(parsedPayload, [validations]);

                await this.context.jobQueue.updateOne({ id: i.id }, { status: JobStatus.Success });
            }),
        );
        const promises = await Promise.allSettled(
            jobs.map(async i => {
                const payload = JSON.parse(i.payload) as JobPayload;
                await this.submitMessage(payload, payload.parsedReceipt.validatorLibs);
                return i.id;
            }),
        );
        const jobIds = promises.filter(i => i.status === 'fulfilled').map(i => i.value);
        await this.context.jobQueue.updateMany(
            { id: { in: jobIds } },
            { status: JobStatus.WaitingTxFinality },
        );
    }

    async pumpFailedConfirm() {
        const jobs = await this.context.jobQueue.getList(
            {
                OR: [
                    // failed
                    { status: JobStatus.ConfirmFailed, validatorType: ValidatorType.CRE },
                    // timeout
                    {
                        status: JobStatus.ProcessingConfirm,
                        updatedAt: { lte: new Date(Date.now() - 5 * 60_000) },
                        validatorType: ValidatorType.CRE,
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
