import { IValidatorAdapter } from './validator-adapter.interface';

import { JobStatus } from '../../../types';
import { Context, ValidatorType } from '../../types';
import { BaseValidatorService } from '../base-validator.service';

export class EmptyValidatorAdapter extends BaseValidatorService implements IValidatorAdapter {
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
}
