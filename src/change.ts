import { PrismaClient } from '@prisma/client';

import { JobStatus } from './relayer/types';

const prisma = new PrismaClient();

prisma.job
    .updateMany({
        where: { status: JobStatus.Processing },
        data: { status: JobStatus.RequestFailed },
    })
    .then(() => console.log('success'))
    .catch(e => console.error(`error: ${e.toString()}`));
