import { ApiController } from './api.controller';
import fastify, { FastifyInstance } from 'fastify';

import { LogModule } from '../log';
import { ContextProvider } from '../services';
import { Context } from '../types';

export class ApiModule extends ContextProvider {
    private readonly app: FastifyInstance;
    private readonly apiController: ApiController;

    constructor(context: Context) {
        super('ApiModule', context);
        this.app = fastify({ logger: true });
        this.apiController = new ApiController(context, this.app);
    }

    async init(refetchLog: LogModule['refetchLog']): Promise<void> {
        this.apiController.setup(refetchLog);
        this.app.listen({ port: 5000, host: '0.0.0.0' }).catch(this.logger.error);
    }
}
