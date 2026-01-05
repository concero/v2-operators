import { ApiService } from './api.service';
import { FastifyInstance } from 'fastify';

import { LogModule } from '../log';
import { ContextProvider } from '../services';
import { Context } from '../types';

export class ApiController extends ContextProvider {
    private readonly app: FastifyInstance;
    private readonly apiService: ApiService;

    constructor(context: Context, fastify: FastifyInstance) {
        super('ApiController', context);
        this.app = fastify;
        this.apiService = new ApiService(context);
    }

    setup(refetchLog: LogModule['refetchLog']): void {
        const handleCRECallback = this.apiService.handleCRECallback.bind(this.apiService);
        const checkManagementAccess = this.apiService.checkManagementAccess.bind(this.apiService);
        const handleGetJobsList = this.apiService.handleGetJobsList.bind(this.apiService);
        const handleRetryJob = this.apiService.handleRetryJob.bind(this.apiService);
        const handleGetChainsList = this.apiService.handleGetChainsList.bind(this.apiService);

        this.app.register(
            async apiV1 => {
                apiV1.post('/callbacks/cre', handleCRECallback);

                apiV1.register(
                    async managementApi => {
                        managementApi.addHook('preHandler', checkManagementAccess);
                        managementApi.get('/jobs', handleGetJobsList);
                        managementApi.get('/jobs/retry', (req, res) =>
                            handleRetryJob(req, res, refetchLog),
                        );
                        managementApi.get('/chains', handleGetChainsList);
                    },
                    {
                        prefix: '/management',
                    },
                );
            },
            {
                prefix: '/api/v1',
            },
        );
    }
}
