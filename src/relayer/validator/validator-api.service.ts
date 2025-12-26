import fastify, { FastifyInstance } from 'fastify';

import { CRE } from '../../types';
import { ObjectLib } from '../../utils';
import { ContextProvider } from '../services';
import { Context } from '../types';

export class ValidatorApiService extends ContextProvider {
    private readonly app: FastifyInstance;

    constructor(context: Context) {
        super('ValidatorApiService', context);
        this.app = fastify({ logger: true });
        setInterval(async () => {
            await this.calculateConfirmations();
        }, 1000);
    }

    async init() {
        this.app.post('/api/v1/callback/cre', async (req, res) => {
            try {
                this.logger.info(
                    `CRE Callback Got: ${ObjectLib.stringify(req.body as Record<string, unknown>)}`,
                );
                await this.addConfirmationCallback(req.body as CRE.Response);
            } catch (e) {
                this.logger.error(
                    `CRE Callback Failed: ${e?.toString()} ${ObjectLib.stringify(req.body as Record<string, unknown>)}`,
                );
            }

            return res.status(200).send({ statusCode: 200, ok: true });
        });
        this.app.get('/api/v1/processes', async (_, res) => {
            const data = await this.context.jobQueue.getList();
            const getItem = (i: any) => ({
                ...i,
                payload: {
                    ...JSON.parse(i.payload),
                    data: { ...JSON.parse(i.payload)?.data, messageReceipt: undefined },
                    payload: undefined,
                    parsedReceipt: undefined,
                    callbacks: undefined,
                },
            });

            res.headers({ 'content-type': 'application/json' }).send({
                statusCode: 200,
                ok: true,
                total: data.length,
                jobs: data.map(getItem),
            });
        });
        this.app.get('/api/v1/chains', async (_, res) => {
            const data = await this.context.dbClient.logsListenerBlockCheckpoints.findMany();

            res.headers({ 'content-type': 'application/json' }).send({
                statusCode: 200,
                ok: true,
                total: data.length,
                data: data.map(i => ({ ...i, blockNumber: String(i.blockNumber) })),
            });
        });
        this.app.listen({ port: 5000, host: '0.0.0.0' }).catch(this.logger.error);
    }

    private async addConfirmationCallback(response: CRE.Response) {
        const items = Object.entries(response || {});
        if (items.length === 0) {
            return;
        }

        const start = Date.now();

        await this.context.dbClient.creCallback.createMany({
            data: items.map(([messageId, payload]) => ({
                messageId,
                payload: JSON.stringify(payload),
            })),
        });

        this.logger.info(`creCallback.createMany took: ${(Date.now() - start) / 1000}s`);
    }

    private async calculateConfirmations() {
        const callbacks = await this.context.dbClient.creCallback.groupBy({
            by: ['messageId'],
            _count: {
                messageId: true,
            },
        });

        await Promise.allSettled(
            callbacks.map(async callback => {
                await this.context.jobQueue.updateOne(
                    { messageId: callback.messageId },
                    { callbacksCount: callback._count.messageId },
                );
            }),
        );
    }
}
