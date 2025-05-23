import { Abi } from "viem";

import { abi as conceroRouterAbi } from "../abi/ConceroRouter.json";
import { abi as conceroVerifierAbi } from "../abi/ConceroVerifier.json";
import { getEnvVar } from "../common/utils/getEnvVar";
import { type GlobalConfig } from "../types/GlobalConfig";

import { getRpcExtension, getRpcOverride } from "./localRpcLoaders";

const globalConfig: GlobalConfig = {
    NETWORK_MODE: getEnvVar("NETWORK_MODE"),
    OPERATOR_ADDRESS: getEnvVar("OPERATOR_ADDRESS"),
    IGNORED_NETWORK_IDS: [44787],
    WHITELISTED_NETWORK_IDS: {
        //     mainnet: [1, 137],
        testnet: [421614],
        //     localhost: [1],
    },
    POLLING_INTERVAL_MS: parseInt(getEnvVar("POLLING_INTERVAL_MS")) || 5000,
    BLOCK_HISTORY_SIZE: parseInt(getEnvVar("BLOCK_HISTORY_SIZE")) || 400, // Number of blocks to store for reorg detection
    LOG_LEVEL: getEnvVar("LOG_LEVEL") || "info", // "error" | "warn" | "info" | "debug"
    LOG_DIR: "logs",
    URLS: {
        CONCERO_RPCS: `https://raw.githubusercontent.com/concero/rpcs/refs/heads/${process.env.RPC_SERVICE_GIT_BRANCH ?? "master"}/output/`,
        CONCERO_DEPLOYMENTS: `https://raw.githubusercontent.com/concero/v2-contracts/refs/heads/${process.env.DEPLOYMENTS_SERVICE_GIT_BRANCH ?? "master"}/.env.deployments.${getEnvVar("NETWORK_MODE") === "localhost" || getEnvVar("NETWORK_MODE") === "testnet" ? "testnet" : "mainnet"}`,
        V2_NETWORKS: {
            MAINNET_SUMMARY:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet.json",
            TESTNET_SUMMARY:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet.json",
            MAINNET_DETAIL_BASE:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet",
            TESTNET_DETAIL_BASE:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet",
        },
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
            retryCount: 3,
            retryDelay: 2000,
        },
        SIMULATE_TX: getEnvVar("SIMULATE_TX") === "true" ? true : false,
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
    RPC: {
        OVERRIDE: getRpcOverride(),
        EXTENSION: getRpcExtension(),
    },
    TX_MANAGER: {
        DRY_RUN: getEnvVar("DRY_RUN") === "true" ? true : false,
        DEFAULT_CONFIRMATIONS: 3,
        DEFAULT_RECEIPT_TIMEOUT: 60_000,
    },
    NETWORK_MANAGER: {
        DEFAULT_BLOCK_CONFIRMATIONS: 2,
        NETWORK_UPDATE_INTERVAL_MS: 1000 * 60 * 60, // 1 hour
    },
    BLOCK_MANAGER: {
        SEQUENTIAL_BATCH_SIZE: 100n,
        CATCHUP_BATCH_SIZE: 500n,
        MAX_BLOCKS_TO_PROCESS: 100n,
        USE_CHECKPOINTS: getEnvVar("USE_CHECKPOINTS") === "true" ? true : false,
    },
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: process.env.SLACK_MONITORING_SYSTEM_CHANNEL_ID,
            BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        },
        INTERVAL: 60 * 60 * 1000,
    },
};

export { globalConfig };
