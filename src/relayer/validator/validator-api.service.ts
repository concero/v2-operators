import fastify, { FastifyInstance } from 'fastify';

import { ObjectLib } from '../../utils';
import { ContextProvider } from '../services';
import { Context, CRE, JobPayload } from '../types';

export class ValidatorApiService extends ContextProvider {
    private readonly app: FastifyInstance;

    constructor(context: Context) {
        super('ValidatorApiService', context);
        this.app = fastify({ logger: true });
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
        // @todo: avoid promise.all
        const handleResponseItem = async ([messageId, item]: [
            messageId: string,
            item: CRE.Response.Item,
        ]): Promise<void> => {
            const found = await this.context.jobQueue.findOne({ messageId });

            if (!found) {
                this.logger.warn(`Job for messageId=${messageId} not found`);
                return;
            }


            const foundPayload = JSON.parse(found.payload) as JobPayload;

            const mergedCallbacks: CRE.Response.Item[] = foundPayload?.callbacks
                ? Array.from((foundPayload['callbacks'] || []) as CRE.Response.Item[]).concat(item)
                : [item];
            const mergedPayload = {
                ...foundPayload,
                callbacks: mergedCallbacks,
            };

            this.logger.info(`From CRE::  [messageId=${messageId}] callbacksCount=${found.callbacksCount} ${typeof found.callbacksCount} merged=${mergedCallbacks.join(';')}`)


            if (found.callbacksCount || 0 > 3) {
                this.logger.warn(
                    `Job messageId=${messageId} callbacks count already ${found.callbacksCount}`,
                );
                return;
            }



            await this.context.jobQueue.updateOne(
                { messageId },
                {
                    payload: JSON.stringify(mergedPayload),
                    callbacksCount: mergedCallbacks.length || 0,
                },
            );

            this.logger.debug(
                `Callbacks for messageId=${messageId} count is ${mergedCallbacks?.length || 0}`,
            );
        };

        await Promise.all(
            Object.entries(response || {}).map(async options => handleResponseItem(options)),
        );
    }
}
