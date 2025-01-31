import { configureDotEnv } from "../common/utils/dotenvConfig";
import { config } from "./constants/config";
import { setupEventListeners } from "./eventListener/setupEventListeners";

function main() {
    configureDotEnv();
    setupEventListeners(config.POLLING_INTERVAL_MS).then();
}

main();
