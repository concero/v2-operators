import {
    Abi,
    Address,
    FallbackTransportConfig,
    WaitForTransactionReceiptParameters,
    WriteContractParameters,
} from "viem";

type GlobalConfig = {
    NETWORK_MODE: string;
    WHITELISTED_NETWORK_IDS: {
        mainnet: number[];
        testnet: number[];
        localhost: number[];
    };
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_DIR: string;
    LOG_MAX_FILES: string;
    URLS: {
        CONCERO_RPCS: string;
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
};

export { GlobalConfig };
