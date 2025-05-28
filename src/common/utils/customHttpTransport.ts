import { Transport, http } from "viem";

import { Logger } from "./logger";

export function createCustomHttpTransport(url: string): Transport {
    const logger = Logger.getInstance().getLogger("ViemTransport");

    return config => {
        // Get the original transport
        const transport = http(url, { batch: true })(config);

        // Create a wrapper for the request method that logs requests
        const originalRequest = transport.request;
        transport.request = async args => {
            logger.debug(`${args.method} - ${url}: ${JSON.stringify(args.params)}`);

            const result = await originalRequest(args);
            return result;
        };

        return transport;
    };
}
