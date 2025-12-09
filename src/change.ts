import { PrismaClient } from '@prisma/client';

import { JobStatus } from './relayer/types';

const prisma = new PrismaClient();

prisma.$connect().then(() => {
    prisma.job.update({
        where: { status: JobStatus.Processing },
        data: { status: JobStatus.RequestFailed },
    });
});
