import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';

import { JobPayload, JobStatus } from '../../../types';
import { Context, ValidatorType } from '../../types';

export class EmptyValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('EmptyValidatorAdapter', context);
    }

    async pumpPendingRequest(size: number): Promise<void> {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingRequest, validatorType: ValidatorType.Empty },
            { take: size },
        );

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { status: JobStatus.ProcessingConfirm },
        );
    }

    async pumpFailedRequest(size: number): Promise<void> {
        // not used
    }

    async pumpStuckVerificationRequests(size: number): Promise<void> {
        // not used
    }

    async pumpPendingConfirm(size: number): Promise<void> {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.ProcessingConfirm, validatorType: ValidatorType.Empty },
            { take: size },
        );

        const promises = await Promise.allSettled(
            jobs.map(async i => {
                const payload = JSON.parse(i.payload) as JobPayload;
                const dst = await this.submitMessage(payload, [], []);
                this.logger.info(
                    `Submitted message hash=${dst.hash}, blockNumber=${String(dst.blockNumber)}`,
                );
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
}
