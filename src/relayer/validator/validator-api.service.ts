import { CREVerifierStrategy } from './strategies';
import { Job } from '@prisma/client';
import fastify, { FastifyInstance } from 'fastify';

import { ObjectLib } from '../../utils';
import { ContextProvider } from '../services';
import { Context } from '../types';

export class ValidatorApiService extends ContextProvider {
    private readonly app: FastifyInstance;
    private readonly creVerifier: CREVerifierStrategy;

    constructor(context: Context, creVerifier: CREVerifierStrategy) {
        super('ValidatorApiService', context);
        this.creVerifier = creVerifier;
        this.app = fastify({ logger: true });
    }

    async setupAPI() {
        this.app.post('/api/v1/callback/cre', async (req, res) => {
            try {
                this.logger.info(
                    `CRE Callback Got: ${ObjectLib.stringify(req.body as Record<string, unknown>)}`,
                );
                await this.creVerifier.addConfirmationCallback(
                    req.body as CREVerifierStrategy.CRE.Response,
                );
            } catch (e) {
                this.logger.error(
                    `CRE Callback Failed: ${e?.toString()} ${ObjectLib.stringify(req.body as Record<string, unknown>)}`,
                );
            }

            return res.status(200).send({ statusCode: 200, ok: true });
        });
        this.app.get('/api/v1/processes', async (_, res) => {
            const data = await this.context.jobQueue.getList();
            let processes: Record<string, { jobs: Job[]; size: number }> = {};
            const getItem = (i: any) => ({ ...i, payload: JSON.parse(i.payload) });

            for (const process of data) {
                if (processes[process.status]) {
                    const prev = processes[process.status];
                    processes[process.status] = {
                        jobs: prev.jobs.concat(getItem(process)),
                        size: prev.size + 1,
                    };
                } else {
                    processes[process.status] = {
                        jobs: [getItem(process)],
                        size: 1,
                    };
                }
            }
            res.headers({ 'content-type': 'application/json' }).send({
                statusCode: 200,
                ok: true,
                total: data.length,
                ...processes,
            });
        });
        this.app.listen({ port: 5000, host: '0.0.0.0' }).catch(this.logger.error);
    }
}
