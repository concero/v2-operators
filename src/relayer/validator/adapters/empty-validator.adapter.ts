import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';

import { Context, JobPayload, JobStatus, ValidatorType } from '../../types';

export class EmptyValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('EmptyValidatorAdapter', context);
    }

    async pumpPendingRequest() {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.Empty },
            { take: 100 },
        );

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { status: JobStatus.ProcessingConfirm },
        );
    }

    async pumpFailedRequest() {
        // not used
    }

    async pumpPendingConfirm() {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingConfirm, validatorType: ValidatorType.Empty },
            { take: 20 },
        );

        const promises = await Promise.allSettled(
            jobs.map(async i => {
                const payload = JSON.parse(i.payload) as JobPayload;
                const dst = await this.submitMessage(payload, payload.parsedReceipt.validatorLibs);
                await this.context.jobQueue.updateOne(
                    { id: i.id },
                    { dstBlockNumber: String(dst.blockNumber) },
                );
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
        // not used
    }
}
