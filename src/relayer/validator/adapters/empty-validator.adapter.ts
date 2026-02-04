import { BaseValidatorAdapter } from './base-validator.adapter';
import { IValidatorAdapter } from './validator-adapter.interface';

import { JobPayload, JobStatus } from '../../../types';
import { Context, ValidatorType } from '../../types';

export class EmptyValidatorAdapter extends BaseValidatorAdapter implements IValidatorAdapter {
    constructor(context: Context) {
        super('EmptyValidatorAdapter', context);
    }

    async pumpPendingVerification(size: number): Promise<void> {
        const jobs = await this.context.jobQueue.getList(
            { status: JobStatus.PendingVerification, validatorType: ValidatorType.Empty },
            { take: size },
        );
        if (!jobs.length) {
            return;
        }

        const jobIds = jobs.map(i => i.id);
        await this.context.jobQueue.updateMany(
            { id: { in: jobIds } },
            { status: JobStatus.PendingSubmit, submitPlannedTo: new Date() },
        );
    }

    async pumpFailedVerification(size: number): Promise<void> {
        // not used
    }

    async pumpStuckVerificationRequests(size: number): Promise<void> {
        // not used
    }

    async pumpPendingSubmit(size: number): Promise<void> {
        const jobs = await this.context.jobQueue.getList(
            {
                status: JobStatus.PendingSubmit,
                validatorType: ValidatorType.Empty,
                OR: [
                    {
                        submitPlannedTo: {
                            lt: new Date(),
                        },
                    },
                ],
            },
            { take: size },
        );

        if (!jobs.length) {
            return;
        }

        await this.context.jobQueue.updateMany(
            { id: { in: jobs.map(i => i.id) } },
            { lastSubmitAt: new Date(Date.now()) },
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
                    { dstBlockNumber: String(dst.blockNumber), dstTxHash: dst.hash },
                );
                return i.id;
            }),
        );
        const jobIds = promises.filter(i => i.status === 'fulfilled').map(i => i.value);
        await this.context.jobQueue.updateMany(
            { id: { in: jobIds } },
            { status: JobStatus.WaitingDstFinality },
        );
    }
}
