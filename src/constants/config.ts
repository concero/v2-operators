import { type GlobalConfig } from "../types/GlobalConfig";

const config: GlobalConfig = {
    NETWORK_MODE: process.env.NETWORK_MODE || "mainnet",
    WHITELISTED_NETWORK_IDS: {
        mainnet: [1, 137],
        testnet: [84532, 80002],
        localhost: [1337],
    },
    LOG_LEVEL: process.env.LOG_LEVEL || "info", // "error" | "warn" | "info" | "debug"
    LOG_DIR: "logs",
    LOG_MAX_FILES: "7d",
    VIEM: {
        RECEIPT: {
            timeout: 0,
            confirmations: 2,
        },
        WRITE_CONTRACT: {
            gas: 3000000n,
        },
        CLIENT_ROTATION_INTERVAL_MS: 1000 * 60 * 60 * 1,
    },
};

export { config };
