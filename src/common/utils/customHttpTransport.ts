import { http, Transport } from "viem";

export function createCustomHttpTransport(url: string): Transport {
    return http(url, {
        batch: true,
    });
}
