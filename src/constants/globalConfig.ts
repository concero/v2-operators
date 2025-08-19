import { getRpcExtension, getRpcOverride } from './localRpcLoaders';

import { getGranularLogLevels } from '@concero/operator-utils';
import { Abi } from 'viem';

import { abi as conceroRouterAbi } from '../abi/ConceroRouter.json';
import { abi as conceroVerifierAbi } from '../abi/ConceroVerifier.json';
import { type GlobalConfig } from '../types/GlobalConfig';
import { getEnvBigint, getEnvBool, getEnvInt, getEnvString } from '../utils/getEnvVar';

const networkMode = getEnvString('NETWORK_MODE', 'testnet');

const globalConfig: GlobalConfig = {
    NETWORK_MODE: networkMode,
    OPERATOR_ADDRESS: getEnvString('OPERATOR_ADDRESS'),
    IGNORED_NETWORK_IDS: [],
    WHITELISTED_NETWORK_IDS: {
        mainnet: [],
        testnet: [],
        localhost: [
            /* 1 */
        ],
    },
    LOGGER: {
        LOG_LEVEL_DEFAULT: getEnvString('LOGGER_LOG_LEVEL_DEFAULT', 'info'),
        LOG_LEVELS_GRANULAR: getGranularLogLevels(),
        LOG_DIR: getEnvString('LOGGER_LOG_DIR', 'logs'),
        LOG_MAX_FILES: getEnvString('LOGGER_LOG_MAX_FILES', '7d'),
        LOG_MAX_SIZE: getEnvString('LOGGER_LOG_MAX_SIZE', '20m'),
    },
    URLS: {
        CONCERO_RPCS: getEnvString(
            'URLS_CONCERO_RPCS',
            `https://raw.githubusercontent.com/concero/rpcs/refs/heads/${getEnvString('URLS_RPC_SERVICE_GIT_BRANCH', 'master')}/output`,
        ),
        CONCERO_DEPLOYMENTS: getEnvString(
            'URLS_CONCERO_DEPLOYMENTS',
            `https://raw.githubusercontent.com/concero/v2-contracts/refs/heads/${getEnvString('URLS_DEPLOYMENTS_SERVICE_GIT_BRANCH', 'master')}/.env.deployments.${
                networkMode === 'localhost' || networkMode === 'testnet' ? 'testnet' : 'mainnet'
            }`,
        ),
        V2_NETWORKS: {
            MAINNET: getEnvString(
                'URLS_V2_NETWORKS_MAINNET',
                'https://github.com/concero/v2-networks/raw/refs/heads/master/networks/mainnet.json',
            ),
            TESTNET: getEnvString(
                'URLS_V2_NETWORKS_TESTNET',
                'https://github.com/concero/v2-networks/raw/refs/heads/master/networks/testnet.json',
            ),
        },
    },
    VIEM: {
        RECEIPT: {},
        WRITE_CONTRACT: {},
        TX_RECEIPT_OPTIONS: {
            confirmations: getEnvInt('VIEM_TX_RECEIPT_CONFIRMATIONS', 1),
            retryCount: getEnvInt('VIEM_TX_RECEIPT_RETRY_COUNT', 5),
            retryDelay: getEnvInt('VIEM_TX_RECEIPT_RETRY_DELAY', 1000),
            timeout: getEnvInt('VIEM_TX_RECEIPT_TIMEOUT', 30_000),
        },
        HTTP_TRANSPORT_CONFIG: {
            timeout: getEnvInt('VIEM_HTTP_TRANSPORT_TIMEOUT', 5_000),
            batch: getEnvBool('VIEM_HTTP_TRANSPORT_BATCH', true),
            retryCount: getEnvInt('VIEM_HTTP_TRANSPORT_RETRY_COUNT', 5),
            retryDelay: getEnvInt('VIEM_HTTP_TRANSPORT_RETRY_DELAY', 100),
        },
        FALLBACK_TRANSPORT_OPTIONS: {
            retryCount: getEnvInt('VIEM_FALLBACK_TRANSPORT_RETRY_COUNT', 5),
            retryDelay: getEnvInt('VIEM_FALLBACK_TRANSPORT_RETRY_DELAY', 150),
        },
        SIMULATE_TX: getEnvBool('VIEM_SIMULATE_TX', false),
        RELAYER: {
            MESSAGE_REPORT_REQUEST_CONFIRMATIONS: getEnvInt(
                'VIEM_RELAYER_MESSAGE_REPORT_REQUEST_CONFIRMATIONS',
                3,
            ),
            MESSAGE_REPORT_REQUEST_TIMEOUT_MS: getEnvInt(
                'VIEM_RELAYER_MESSAGE_REPORT_REQUEST_TIMEOUT_MS',
                60_000,
            ),
        },
    },
    HTTPCLIENT: {
        DEFAULT_TIMEOUT: getEnvInt('HTTPCLIENT_DEFAULT_TIMEOUT', 5000),
        MAX_RETRIES: getEnvInt('HTTPCLIENT_MAX_RETRIES', 3),
        RETRY_DELAY: getEnvInt('HTTPCLIENT_RETRY_DELAY', 100),
    },
    ABI: {
        CONCERO_VERIFIER: conceroVerifierAbi as Abi,
        CONCERO_ROUTER: conceroRouterAbi as Abi,
    },
    RPC: {
        OVERRIDE: getRpcOverride(),
        EXTENSION: getRpcExtension(),
    },
    TX_WRITER: {
        DRY_RUN: getEnvBool('TX_WRITER_DRY_RUN', false),
        DEFAULT_RECEIPT_TIMEOUT: getEnvInt('TX_WRITER_DEFAULT_RECEIPT_TIMEOUT', 60_000),
        GAS_LIMIT: {
            DEFAULT: getEnvBigint('TX_WRITER_GAS_LIMIT_DEFAULT', 2_000_000n),
            SUBMIT_MESSAGE_REPORT_OVERHEAD: getEnvBigint(
                'TX_WRITER_GAS_LIMIT_SUBMIT_MESSAGE_REPORT_OVERHEAD',
                1_000_000n,
            ),
        },
    },
    NETWORK_MANAGER: {
        DEFAULT_FINALITY_CONFIRMATIONS: getEnvInt(
            'NETWORK_MANAGER_DEFAULT_FINALITY_CONFIRMATIONS',
            12,
        ),
        NETWORK_UPDATE_INTERVAL_MS: getEnvInt(
            'NETWORK_MANAGER_NETWORK_UPDATE_INTERVAL_MS',
            1000 * 60 * 60,
        ),
    },
    BLOCK_MANAGER: {
        POLLING_INTERVAL_MS: getEnvInt('BLOCK_MANAGER_POLLING_INTERVAL_MS', 5000),
        SEQUENTIAL_BATCH_SIZE: getEnvBigint('BLOCK_MANAGER_SEQUENTIAL_BATCH_SIZE', 100n),
        CATCHUP_BATCH_SIZE: getEnvBigint('BLOCK_MANAGER_CATCHUP_BATCH_SIZE', 500n),
        MAX_BLOCKS_TO_PROCESS: getEnvBigint('BLOCK_MANAGER_MAX_BLOCKS_TO_PROCESS', 100n),
        USE_CHECKPOINTS: getEnvBool('BLOCK_MANAGER_USE_CHECKPOINTS', true),
    },
    BALANCE_MANAGER: {
        DEFAULT_MIN_BALANCE: getEnvBigint('BALANCE_MANAGER_DEFAULT_MIN_BALANCE', 1_000_000n),
        POLLING_INTERVAL_MS: getEnvInt('BALANCE_MANAGER_POLLING_INTERVAL_MS', 100_000),
        MIN_BALANCES: {},
    },
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: getEnvString(
                'NOTIFICATIONS_SLACK_MONITORING_SYSTEM_CHANNEL_ID',
            ),
            BOT_TOKEN: getEnvString('NOTIFICATIONS_SLACK_BOT_TOKEN'),
        },
        INTERVAL: getEnvInt('NOTIFICATIONS_INTERVAL', 60 * 60 * 1000),
    },
    TX_MONITOR: {
        MAX_INCLUSION_ATTEMPTS: getEnvInt('TX_MONITOR_MAX_INCLUSION_ATTEMPTS', 5),
    },
};

export { globalConfig };
