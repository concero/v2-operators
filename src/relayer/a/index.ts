import { configureDotEnv } from "../../utils/dotenvConfig";
import { setupEventListeners } from "./setupEventListeners";
import { config } from "./config";

function main() {
    configureDotEnv();
    setupEventListeners(config.POLLING_INTERVAL_MS).then();
}

main();
