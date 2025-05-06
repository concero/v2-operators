import { Transport } from "viem";

export function createCustomHttpTransport(url: string): Transport {
    return () => ({
        name: `customHttp-${url}`,
        async request({ method, params }: { method: string; params: unknown[] }) {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: Date.now(),
                    method,
                    params,
                }),
            });

            const jsonResponse = await response.json();

            if (method === "eth_getTransactionByHash" && !jsonResponse.result) {
                throw new Error("Transaction not found");
            }

            if (!response.ok || jsonResponse.error) {
                throw new Error(
                    `Error from ${url}: ${jsonResponse.error?.message || response.statusText}`,
                );
            }

            return jsonResponse.result;
        },
        config: {
            onFetchResponse(response: Response) {
                if (!response.ok) {
                    console.log("RPC node response:", {
                        status: response.status,
                        node: response.url,
                    });
                    if (
                        (response.status >= 500 && response.status <= 599) ||
                        response.status === 429 ||
                        response.status === 403
                    ) {
                        throw new Error("RPC Server error, switching to another node...");
                    }
                }
            },
            batch: true,
        },
    });
}
