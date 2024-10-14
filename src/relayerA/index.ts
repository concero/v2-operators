import { configureDotEnv } from "../utils/dotenvConfig";

import { setupEventListeners } from "./eventListener";

(function main() {
    configureDotEnv();
    setupEventListeners();
})();
