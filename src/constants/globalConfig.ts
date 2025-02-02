import fs from "fs";
import path from "path";
import { getEnvVar } from "../relayer/common/utils/getEnvVar";
import { type GlobalConfig } from "../types/GlobalConfig";

const CONCERO_VERIFIER_ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../abi/ConceroVerifier.json"), "utf8"),
);

const CONCERO_ROUTER_ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../abi/ConceroRouter.json"), "utf8"),
);

const globalConfig: GlobalConfig = {
    NETWORK_MODE: getEnvVar("NETWORK_MODE"),
    OPERATOR_ADDRESS: getEnvVar("OPERATOR_ADDRESS"),
    WHITELISTED_NETWORK_IDS: {
        mainnet: [1, 137],
        testnet: [84532, 80002],
        localhost: [1],
    },
    LOG_LEVEL: getEnvVar("LOG_LEVEL") || "info", // "error" | "warn" | "info" | "debug"
    LOG_DIR: "logs",
    URLS: {
        CONCERO_RPCS: "https://raw.githubusercontent.com/concero/rpcs/refs/heads/master/output/",
    },
    LOG_MAX_FILES: "7d",
    VIEM: {
        RECEIPT: {
            timeout: 0,
            confirmations: 1,
            //todo: for localhost chain this needs to be set to 1. Mainnet chains need their per-chain confirmations found in conceroNetowrks.ts
        },
        WRITE_CONTRACT: {
            gas: 3000000n,
        },
        FALLBACK_TRANSPORT_OPTIONS: {
            rank: true,
            retryCount: 3,
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
        CONCERO_VERIFIER: CONCERO_VERIFIER_ABI,
        CONCERO_ROUTER: CONCERO_ROUTER_ABI,
    },
};

export { globalConfig };
