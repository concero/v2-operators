import {
    Abi,
    Address,
    FallbackTransportConfig,
    WaitForTransactionReceiptParameters,
    WriteContractParameters,
} from "viem";

type GlobalConfig = {
    NETWORK_MODE: string;
    IGNORED_NETWORK_IDS: number[];
    WHITELISTED_NETWORK_IDS: {
        mainnet: number[];
        testnet: number[];
        localhost: number[];
    };
    POLLING_INTERVAL_MS: number;
    BLOCK_HISTORY_SIZE: number; // Number of blocks to store for reorg detection
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_DIR: string;
    LOG_MAX_FILES: string;
    URLS: {
        CONCERO_RPCS: string;
        CONCERO_DEPLOYMENTS: string;
        V2_NETWORKS: {
            MAINNET_SUMMARY: string;
            TESTNET_SUMMARY: string;
            MAINNET_DETAIL_BASE: string;
            TESTNET_DETAIL_BASE: string;
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
        FALLBACK_TRANSPORT_OPTIONS: Partial<FallbackTransportConfig>;
        SIMULATE_TX: boolean;
    };
    OPERATOR_ADDRESS: Address;
    ABI: {
        CONCERO_VERIFIER: Abi;
        CONCERO_ROUTER: Abi;
    };
    RPC: { OVERRIDE: any; EXTENSION: any };
    TX_MANAGER: {
        DRY_RUN: boolean;
        DEFAULT_CONFIRMATIONS: number;
        DEFAULT_RECEIPT_TIMEOUT: number;
    };
    NETWORK_MANAGER: {
        DEFAULT_BLOCK_CONFIRMATIONS: number;
        NETWORK_UPDATE_INTERVAL_MS: number;
    };
    BLOCK_MANAGER: {
        SEQUENTIAL_BATCH_SIZE: bigint;
        CATCHUP_BATCH_SIZE: bigint;
        MAX_BLOCKS_TO_PROCESS: bigint;
        USE_CHECKPOINTS: boolean;
    };
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: string | undefined;
            BOT_TOKEN: string | undefined;
        };
        INTERVAL: number;
    };
};

export { GlobalConfig };
