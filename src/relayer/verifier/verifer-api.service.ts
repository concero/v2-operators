import fastify, { FastifyInstance } from 'fastify';

import { ContextProvider } from '../services';
import { Context } from '../types';

export class VerifierApiService extends ContextProvider {
    private readonly app: FastifyInstance;

    constructor(context: Context) {
        super('VerifierApiService', context);
        this.app = fastify({ logger: true });
    }

    async init() {
        this.app.post('/api/v1/callback/cre', async (req, res) => {
            try {
                this.logger.info(`CRE Callback Got: ${JSON.stringify(req.body)}`);
                // this.context.eventBus.confirmVerification();
                /*  (this.adapters.cre as CREVerifierAdapter).addConfirmationCallback(
                    req.body as CREVerifierAdapter.ConfirmResponse,
                );*/
            } catch (e) {
                this.logger.error(
                    `CRE Callback Failed: ${e?.toString()} ${JSON.stringify(req.body)}`,
                );
            }

            return res.status(200).send({ statusCode: 200, ok: true });
        });
        this.app.listen({ port: 5000, host: '0.0.0.0' }).catch(this.logger.error);
    }
}
