"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "globalConfig", {
    enumerable: true,
    get: function() {
        return globalConfig;
    }
});
var _ConceroRouterjson = require("../abi/ConceroRouter.json");
var _ConceroVerifierjson = require("../abi/ConceroVerifier.json");
var _utils = require("../common/utils");
var _localRpcLoaders = require("./localRpcLoaders");
var _process_env_RPC_SERVICE_GIT_BRANCH, _process_env_DEPLOYMENTS_SERVICE_GIT_BRANCH;
var globalConfig = {
    NETWORK_MODE: (0, _utils.getEnvVar)("NETWORK_MODE"),
    OPERATOR_ADDRESS: (0, _utils.getEnvVar)("OPERATOR_ADDRESS"),
    IGNORED_NETWORK_IDS: [
        44787,
        1114
    ],
    WHITELISTED_NETWORK_IDS: {
        mainnet: [],
        testnet: [
            421614,
            80069
        ],
        localhost: []
    },
    LOGGER: {
        LOG_LEVEL_DEFAULT: (0, _utils.getOptionalEnvVar)("LOG_LEVEL_DEFAULT", "info"),
        LOG_LEVELS_GRANULAR: (0, _utils.getGranularLogLevels)(),
        LOG_DIR: "logs",
        LOG_MAX_FILES: "7d",
        LOG_MAX_SIZE: "20m"
    },
    URLS: {
        CONCERO_RPCS: "https://raw.githubusercontent.com/concero/rpcs/refs/heads/".concat((_process_env_RPC_SERVICE_GIT_BRANCH = process.env.RPC_SERVICE_GIT_BRANCH) !== null && _process_env_RPC_SERVICE_GIT_BRANCH !== void 0 ? _process_env_RPC_SERVICE_GIT_BRANCH : "master", "/output/"),
        CONCERO_DEPLOYMENTS: "https://raw.githubusercontent.com/concero/v2-contracts/refs/heads/".concat((_process_env_DEPLOYMENTS_SERVICE_GIT_BRANCH = process.env.DEPLOYMENTS_SERVICE_GIT_BRANCH) !== null && _process_env_DEPLOYMENTS_SERVICE_GIT_BRANCH !== void 0 ? _process_env_DEPLOYMENTS_SERVICE_GIT_BRANCH : "master", "/.env.deployments.").concat((0, _utils.getEnvVar)("NETWORK_MODE") === "localhost" || (0, _utils.getEnvVar)("NETWORK_MODE") === "testnet" ? "testnet" : "mainnet"),
        V2_NETWORKS: {
            MAINNET_SUMMARY: "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet.json",
            TESTNET_SUMMARY: "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet.json",
            MAINNET_DETAIL_BASE: "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet",
            TESTNET_DETAIL_BASE: "https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet"
        }
    },
    VIEM: {
        RECEIPT: {},
        WRITE_CONTRACT: {},
        FALLBACK_TRANSPORT_OPTIONS: {
            retryCount: 3,
            retryDelay: 2000
        },
        SIMULATE_TX: (0, _utils.getEnvVar)("SIMULATE_TX") === "true"
    },
    HTTPCLIENT: {
        DEFAULT_TIMEOUT: 5000,
        MAX_RETRIES: 3,
        RETRY_DELAY: 1000
    },
    ABI: {
        CONCERO_VERIFIER: _ConceroVerifierjson.abi,
        CONCERO_ROUTER: _ConceroRouterjson.abi,
        EVM_DST_CHAIN_DATA: {
            components: [
                {
                    internalType: "address",
                    name: "receiver",
                    type: "address"
                },
                {
                    internalType: "uint256",
                    name: "gasLimit",
                    type: "uint256"
                }
            ],
            internalType: "struct ConceroTypes.EvmDstChainData",
            name: "dstChainData",
            type: "tuple"
        }
    },
    RPC: {
        OVERRIDE: (0, _localRpcLoaders.getRpcOverride)(),
        EXTENSION: (0, _localRpcLoaders.getRpcExtension)()
    },
    TX_MANAGER: {
        DRY_RUN: (0, _utils.getEnvVar)("DRY_RUN") === "true",
        DEFAULT_CONFIRMATIONS: 3,
        DEFAULT_RECEIPT_TIMEOUT: 60000,
        GAS_LIMIT: {
            DEFAULT: 2000000n,
            SUBMIT_MESSAGE_REPORT_OVERHEAD: 1000000n
        }
    },
    NETWORK_MANAGER: {
        NETWORK_UPDATE_INTERVAL_MS: 1000 * 60 * 60
    },
    BLOCK_MANAGER: {
        POLLING_INTERVAL_MS: parseInt((0, _utils.getEnvVar)("POLLING_INTERVAL_MS")) || 5000,
        SEQUENTIAL_BATCH_SIZE: 100n,
        CATCHUP_BATCH_SIZE: 500n,
        MAX_BLOCKS_TO_PROCESS: 100n,
        USE_CHECKPOINTS: (0, _utils.getEnvVar)("USE_CHECKPOINTS") === "true"
    },
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: process.env.SLACK_MONITORING_SYSTEM_CHANNEL_ID,
            BOT_TOKEN: process.env.SLACK_BOT_TOKEN
        },
        INTERVAL: 60 * 60 * 1000
    }
};
