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
        RECEIPT: WaitForTransactionReceiptParameters;
        WRITE_CONTRACT: WriteContractParameters;
        CLIENT_ROTATION_INTERVAL_MS: number;
        FALLBACK_TRANSPORT_OPTIONS: FallbackTransportConfig;
    };
    OPERATOR_ADDRESS: Address;
    ABI: {
        CONCERO_VERIFIER: Abi;
        CONCERO_ROUTER: Abi;
    };
    RPC: { OVERRIDE: any; EXTENSION: any };
    NOTIFICATIONS: {
        SLACK: {
            MONITORING_SYSTEM_CHANNEL_ID: string | undefined;
            BOT_TOKEN: string | undefined;
        };
        INTERVAL: number;
    };
};

export { GlobalConfig };
