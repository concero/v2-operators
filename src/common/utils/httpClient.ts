import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

import { AppErrorEnum, globalConfig } from "../../constants";
import { ManagerBase } from "../managers";

import { AppError } from "./AppError";
import { Logger, LoggerInterface } from "./logger";

const { RETRY_DELAY, MAX_RETRIES, DEFAULT_TIMEOUT } = globalConfig.HTTPCLIENT;

export class HttpClient extends ManagerBase {
    private static defaultInstance?: HttpClient;
    private static queueInstance?: HttpClient;

    private axiosInstance?: AxiosInstance;
    private logger: LoggerInterface;
    private requestQueue: Array<() => Promise<void>> = [];
    private activeRequests: number = 0;
    private maxConcurrentRequests?: number;

    constructor(maxConcurrentRequests?: number) {
        super();
        this.maxConcurrentRequests = maxConcurrentRequests;
        this.logger = Logger.getInstance().getLogger("HttpClient");
    }

    public static createInstance(maxConcurrentRequests?: number): HttpClient {
        return new HttpClient(maxConcurrentRequests);
    }

    public static getInstance(): HttpClient {
        if (!HttpClient.defaultInstance) {
            HttpClient.defaultInstance = new HttpClient();
        }
        return HttpClient.defaultInstance;
    }

    public static getQueueInstance(): HttpClient {
        if (!HttpClient.queueInstance) {
            HttpClient.queueInstance = new HttpClient(2);
        }
        return HttpClient.queueInstance;
    }

    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }

        try {
            await this.setupAxiosInstance();
            await super.initialize();
        } catch (error) {
            throw error;
        }
    }

    private async setupAxiosInstance(): Promise<void> {
        this.axiosInstance = axios.create({
            timeout: DEFAULT_TIMEOUT,
        });

        this.axiosInstance.interceptors.response.use(
            response => response,
            async error => {
                const config = error.config;
                const logger = this.logger;

                if (config && config.__retryCount < MAX_RETRIES) {
                    config.__retryCount = config.__retryCount || 0;
                    config.__retryCount += 1;

                    logger.warn(
                        `Retrying request to ${config.url}. Attempt ${config.__retryCount} of ${MAX_RETRIES}. Error: ${error.message}`,
                    );

                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));

                    return this.axiosInstance!(config);
                }

                logger.error(
                    `Request to ${config?.url} failed after ${config?.__retryCount || 0} attempts. Error: ${error.message}`,
                );
                throw new AppError(AppErrorEnum.FailedHTTPRequest, error);
            },
        );
    }

    public dispose(): void {
        // Clear the request queue
        this.requestQueue = [];
        this.activeRequests = 0;
        this.axiosInstance = undefined;
        super.dispose();
    }

    public static disposeInstances(): void {
        if (HttpClient.defaultInstance) {
            HttpClient.defaultInstance.dispose();
            HttpClient.defaultInstance = undefined;
        }
        if (HttpClient.queueInstance) {
            HttpClient.queueInstance.dispose();
            HttpClient.queueInstance = undefined;
        }
    }

    private async processQueue(): Promise<void> {
        if (
            (this.maxConcurrentRequests === undefined ||
                this.activeRequests < this.maxConcurrentRequests) &&
            this.requestQueue.length > 0
        ) {
            const nextRequest = this.requestQueue.shift();
            if (nextRequest) {
                this.activeRequests++;
                try {
                    await nextRequest();
                } finally {
                    this.activeRequests--;
                    this.processQueue();
                }
            }
        }
    }

    private enqueueRequest(requestFn: () => Promise<void>): void {
        this.requestQueue.push(requestFn);
        this.processQueue();
    }

    private async request<T>(
        method: "GET" | "POST",
        url: string,
        config: AxiosRequestConfig = {},
        body?: any,
    ): Promise<T> {
        if (!this.initialized || !this.axiosInstance) {
            throw new AppError(
                AppErrorEnum.FailedHTTPRequest,
                new Error("HttpClient not initialized"),
            );
        }

        return new Promise<T>((resolve, reject) => {
            const executeRequest = async () => {
                try {
                    // logger.debug(
                    //     `${method} request to ${url} with config: ${JSON.stringify(config)} ${
                    //         body ? `and body: ${JSON.stringify(body)}` : ""
                    //     }`,
                    // );

                    const response: AxiosResponse<T> = await this.axiosInstance!.request<T>({
                        method,
                        url,
                        data: body,
                        ...config,
                    });

                    resolve(response.data);
                } catch (error) {
                    this.logger.error(`Request failed for ${url} with error:`, error);
                    reject(new AppError(AppErrorEnum.FailedHTTPRequest, error));
                }
            };

            this.enqueueRequest(executeRequest);
        });
    }

    public async get<T>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
        return this.request<T>("GET", url, config);
    }

    public async post<T>(url: string, body: any, config: AxiosRequestConfig = {}): Promise<T> {
        return this.request<T>("POST", url, config, body);
    }
}
