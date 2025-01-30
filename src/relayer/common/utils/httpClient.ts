import { config } from "../../../constants/config";
import { AppError } from "./AppError";
import logger from "./logger";

const DEFAULT_TIMEOUT = config.HTTPCLIENT.DEFAULT_TIMEOUT;
const MAX_RETRIES = config.HTTPCLIENT.MAX_RETRIES;
const RETRY_DELAY = config.HTTPCLIENT.RETRY_DELAY;

class HttpClient {
    private async fetchWithTimeout(resource: string, options: RequestInit, timeout: number): Promise<Response> {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(resource, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw new AppError("FailedHTTPRequest", error);
        }
    }

    private async retryFetch(
        resource: string,
        options: RequestInit,
        retries: number,
        timeout: number,
    ): Promise<Response> {
        try {
            const response = await this.fetchWithTimeout(resource, options, timeout);
            if (!response.ok) {
                throw new AppError("FailedHTTPRequest", new Error(`HTTP error! status: ${response.status}`));
            }
            return response;
        } catch (error) {
            if (retries > 0) {
                logger.debug(`Retrying HTTP request (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
                await new Promise(res => setTimeout(res, RETRY_DELAY));
                return this.retryFetch(resource, options, retries - 1, timeout);
            } else {
                throw new AppError("FailedHTTPRequest", error);
            }
        }
    }

    public async get(url: string, options: RequestInit = {}, timeout: number = DEFAULT_TIMEOUT): Promise<any> {
        logger.debug(`GET request to ${url} with options: ${JSON.stringify(options)}`);
        const response = await this.retryFetch(url, { ...options, method: "GET" }, MAX_RETRIES, timeout);
        return response.json();
    }

    public async post(
        url: string,
        body: any,
        options: RequestInit = {},
        timeout: number = DEFAULT_TIMEOUT,
    ): Promise<any> {
        logger.debug(
            `POST request to ${url} with body: ${JSON.stringify(body)} and options: ${JSON.stringify(options)}`,
        );
        const response = await this.retryFetch(
            url,
            { ...options, method: "POST", body: JSON.stringify(body) },
            MAX_RETRIES,
            timeout,
        );
        return response.json();
    }
}

const httpClient = new HttpClient();
export default httpClient;
