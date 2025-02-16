import { configureDotEnv } from "../../utils/dotenvConfig";
import { setupEventListeners } from "./eventListener/setupEventListeners";
import { config } from "./constants/config";
function main() {
    configureDotEnv();
    setupEventListeners(config.POLLING_INTERVAL_MS).then();
}
main();
