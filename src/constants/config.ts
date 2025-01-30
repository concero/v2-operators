import { WaitForTransactionReceiptParameters, WriteContractParameters } from "viem";

const viemReceiptConfig: WaitForTransactionReceiptParameters = {
    timeout: 0,
    confirmations: 2,
};
const writeContractConfig: WriteContractParameters = {
    gas: 3000000n, // 3M
};

const config = {
    NETWORK_MODE: process.env.NETWORK_MODE || "mainnet",
    WHITELISTED_NETWORK_IDS: {
        mainnet: [1, 137],
        testnet: [84532, 80002],
        localhost: [1337],
    },
    LOG_LEVEL: process.env.LOG_LEVEL || "info", // "error" | "warn" | "info" | "debug"
    LOG_DIR: "logs",
    LOG_MAX_FILES: "7d",
};

export { viemReceiptConfig, writeContractConfig, config };
