import { Abi } from "viem";

import { abi as conceroRouterAbi } from "../abi/ConceroRouter.json";
import { abi as conceroVerifierAbi } from "../abi/ConceroVerifier.json";
import { getEnvVar, getGranularLogLevels, getOptionalEnvVar } from "../common/utils";
import { type GlobalConfig } from "../types/GlobalConfig";

import { getRpcExtension, getRpcOverride } from "./localRpcLoaders";

const globalConfig: GlobalConfig = {
    NETWORK_MODE: getEnvVar("NETWORK_MODE"),
    OPERATOR_ADDRESS: getEnvVar("OPERATOR_ADDRESS"),
    IGNORED_NETWORK_IDS: [44787],
    WHITELISTED_NETWORK_IDS: {
        mainnet: [],
        testnet: [],
        localhost: [
            /* 1 */
        ],
    },
    LOGGER: {
        LOG_LEVEL_DEFAULT: getOptionalEnvVar("LOG_LEVEL_DEFAULT", "info"),
        LOG_LEVELS_GRANULAR: getGranularLogLevels(),
        LOG_DIR: "logs",
        LOG_MAX_FILES: "7d",
        LOG_MAX_SIZE: "20m",
    },
    URLS: {
        CONCERO_RPCS: `https://raw.githubusercontent.com/concero/rpcs/refs/heads/${process.env.RPC_SERVICE_GIT_BRANCH ?? "master"}/output`,
        CONCERO_DEPLOYMENTS: `https://raw.githubusercontent.com/concero/v2-contracts/refs/heads/${process.env.DEPLOYMENTS_SERVICE_GIT_BRANCH ?? "master"}/.env.deployments.${getEnvVar("NETWORK_MODE") === "localhost" || getEnvVar("NETWORK_MODE") === "testnet" ? "testnet" : "mainnet"}`,
        V2_NETWORKS: {
            MAINNET:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet.json",
            TESTNET:
                "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet.json",
        },
    },
    VIEM: {
        RECEIPT: {},
        WRITE_CONTRACT: {},
        FALLBACK_TRANSPORT_OPTIONS: {
            retryCount: 5,
            retryDelay: 2000,
        },
        SIMULATE_TX: getEnvVar("SIMULATE_TX") === "true",
    },
    HTTPCLIENT: {
        DEFAULT_TIMEOUT: 5000,
        MAX_RETRIES: 3,
        RETRY_DELAY: 100,
    },
    ABI: {
        CONCERO_VERIFIER: conceroVerifierAbi as Abi,
        CONCERO_ROUTER: conceroRouterAbi as Abi,
        EVM_DST_CHAIN_DATA: {
            components: [
                {
                    internalType: "address",
                    name: "receiver",
                    type: "address",
                },
                {
                    internalType: "uint256",
                    name: "gasLimit",
                    type: "uint256",
                },
            ],
            internalType: "struct ConceroTypes.EvmDstChainData",
            name: "dstChainData",
            type: "tuple",
        },
    },
    RPC: {
        OVERRIDE: getRpcOverride(),
        EXTENSION: getRpcExtension(),
    },
    TX_MANAGER: {
        DRY_RUN: getEnvVar("DRY_RUN") === "true",
        DEFAULT_CONFIRMATIONS: 3,
        DEFAULT_RECEIPT_TIMEOUT: 60_000,
        GAS_LIMIT: {
            DEFAULT: 2_000_000n,
            SUBMIT_MESSAGE_REPORT_OVERHEAD: 1_000_000n,
        },
    },
    NETWORK_MANAGER: {
        NETWORK_UPDATE_INTERVAL_MS: 1000 * 60 * 60, // 1 hour
    },
    BLOCK_MANAGER: {
        POLLING_INTERVAL_MS: parseInt(getEnvVar("BLOCK_MANAGER_POLLING_INTERVAL_MS")) || 5000,
        SEQUENTIAL_BATCH_SIZE: 100n,
        CATCHUP_BATCH_SIZE: 500n,
        MAX_BLOCKS_TO_PROCESS: 100n,
        USE_CHECKPOINTS: getEnvVar("USE_CHECKPOINTS") === "true",
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
