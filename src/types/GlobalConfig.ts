import { WaitForTransactionReceiptParameters, WriteContractParameters } from "viem";

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
    VIEM: {
        RECEIPT: WaitForTransactionReceiptParameters;
        WRITE_CONTRACT: WriteContractParameters;
        CLIENT_ROTATION_INTERVAL_MS: number;
    };
};

export { GlobalConfig };
