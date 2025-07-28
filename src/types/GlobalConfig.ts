import {
    Abi,
    AbiParameter,
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
        FALLBACK_TRANSPORT_OPTIONS: Partial<FallbackTransportConfig>;
        SIMULATE_TX: boolean;
    };
    OPERATOR_ADDRESS: Address;
    ABI: {
        CONCERO_VERIFIER: Abi;
        CONCERO_ROUTER: Abi;
        EVM_DST_CHAIN_DATA: AbiParameter;
    };
    RPC: { OVERRIDE: any; EXTENSION: any };
    TX_MANAGER: {
        DRY_RUN: boolean;
        DEFAULT_CONFIRMATIONS: number;
		DEFAULT_FINALITY_CONFIRMATIONS: number;
        DEFAULT_RECEIPT_TIMEOUT: number;
        GAS_LIMIT: {
            DEFAULT: bigint;
            SUBMIT_MESSAGE_REPORT_OVERHEAD: bigint;
        };
    };
    NETWORK_MANAGER: {
        NETWORK_UPDATE_INTERVAL_MS: number;
    };
    BLOCK_MANAGER: {
        POLLING_INTERVAL_MS: number;
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
