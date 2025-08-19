import {
    Abi,
    AbiParameter,
    Address,
    FallbackTransportConfig,
    HttpTransportConfig,
    WaitForTransactionReceiptParameters,
    WriteContractParameters,
} from 'viem';

type GlobalConfig = {
    NETWORK_MODE: string;
    IGNORED_NETWORK_IDS: number[];
    WHITELISTED_NETWORK_IDS: {
        mainnet: number[];
        testnet: number[];
        localhost: number[];
    };
    LOGGER: {
        LOG_LEVEL_DEFAULT: string;
        LOG_LEVELS_GRANULAR: Record<string, string>;
        LOG_DIR: string;
        LOG_MAX_FILES: string;
        LOG_MAX_SIZE: string;
    };
    URLS: {
        CONCERO_RPCS: string;
        CONCERO_DEPLOYMENTS: string;
        V2_NETWORKS: {
            MAINNET: string;
            TESTNET: string;
        };
    };
    HTTPCLIENT: {
        DEFAULT_TIMEOUT: number;
        MAX_RETRIES: number;
        RETRY_DELAY: number;
    };
    VIEM: {
        RECEIPT: Partial<WaitForTransactionReceiptParameters>;
        WRITE_CONTRACT: Partial<WriteContractParameters>;
        TX_RECEIPT_OPTIONS: {
            confirmations: number;
            retryCount: number;
            retryDelay: number;
            timeout: number;
        };
        FALLBACK_TRANSPORT_OPTIONS: Partial<FallbackTransportConfig>;
        HTTP_TRANSPORT_CONFIG: Partial<HttpTransportConfig>;
        SIMULATE_TX: boolean;
        RELAYER: {
            MESSAGE_REPORT_REQUEST_CONFIRMATIONS: number;
            MESSAGE_REPORT_REQUEST_TIMEOUT_MS: number;
        };
    };
    OPERATOR_ADDRESS: Address;
    ABI: {
        CONCERO_VERIFIER: Abi;
        CONCERO_ROUTER: Abi;
    };
    RPC: { OVERRIDE: any; EXTENSION: any };
    TX_MANAGER: {
        DRY_RUN: boolean;
        DEFAULT_RECEIPT_TIMEOUT: number;
        GAS_LIMIT: {
            DEFAULT: bigint;
            SUBMIT_MESSAGE_REPORT_OVERHEAD: bigint;
        };
    };
    NETWORK_MANAGER: {
        DEFAULT_FINALITY_CONFIRMATIONS: number;
        NETWORK_UPDATE_INTERVAL_MS: number;
    };
    BLOCK_MANAGER: {
        POLLING_INTERVAL_MS: number;
        SEQUENTIAL_BATCH_SIZE: bigint;
        CATCHUP_BATCH_SIZE: bigint;
        MAX_BLOCKS_TO_PROCESS: bigint;
        USE_CHECKPOINTS: boolean;
    };
    BALANCE_MANAGER: {
        DEFAULT_MIN_BALANCE: bigint;
        POLLING_INTERVAL_MS: number;
        MIN_BALANCES: Record<string, bigint>;
    };
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: string | undefined;
            BOT_TOKEN: string | undefined;
        };
        INTERVAL: number;
    };
    TX_MONITOR: {
        MAX_INCLUSION_ATTEMPTS: number;
    };
};

export { GlobalConfig };
