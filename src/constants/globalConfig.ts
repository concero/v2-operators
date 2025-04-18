import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { type GlobalConfig } from "../types/GlobalConfig";

import { Abi } from "viem";
import { abi as conceroRouterAbi } from "../abi/ConceroRouter.json";
import { abi as conceroVerifierAbi } from "../abi/ConceroVerifier.json";

const globalConfig: GlobalConfig = {
    NETWORK_MODE: getEnvVar("NETWORK_MODE"),
    OPERATOR_ADDRESS: getEnvVar("OPERATOR_ADDRESS"),
    WHITELISTED_NETWORK_IDS: {
        mainnet: [1, 137],
        testnet: [
            84532, 421614, 43113, 11155420, 80002, 2021, 6342, 57054, 10_143, 11155111, 59141, 97,
            1946, 33111, 200810, 168587773, 3636, 44787, 338, 10200, 133, 763373, 5003, 534351,
            1328, 157, 1301, 195, 48899, 919, 1114,
        ],
        localhost: [1],
    },
    POLLING_INTERVAL_MS: parseInt(getEnvVar("POLLING_INTERVAL_MS")) || 5000,
    LOG_LEVEL: getEnvVar("LOG_LEVEL") || "info", // "error" | "warn" | "info" | "debug"
    LOG_DIR: "logs",
    URLS: {
        CONCERO_RPCS: "https://raw.githubusercontent.com/concero/rpcs/refs/heads/master/output/",
    },
    LOG_MAX_FILES: "7d",
    VIEM: {
        RECEIPT: {
            timeout: 0,
            confirmations: 2,
            //todo: for localhost chain this needs to be set to 1. Mainnet chains need their per-chain confirmations found in conceroNetowrks.ts
        },
        WRITE_CONTRACT: {
            gas: 3000000n,
        },
        FALLBACK_TRANSPORT_OPTIONS: {
            retryCount: 5,
            retryDelay: 1000,
        },
        CLIENT_ROTATION_INTERVAL_MS: 1000 * 60 * 60 * 1,
    },
    HTTPCLIENT: {
        DEFAULT_TIMEOUT: 5000,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000,
    },
    ABI: {
        CONCERO_VERIFIER: conceroVerifierAbi as Abi,
        CONCERO_ROUTER: conceroRouterAbi as Abi,
    },
};

export { globalConfig };
