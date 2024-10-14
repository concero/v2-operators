import * as dotenv from "dotenv";

const ENV_FILES = [".env", ".env.wallets", ".env.deployments.testnet", ".env.deployments.mainnet"];

/**
 * Configures the dotenv with paths relative to a base directory.
 * @param {string} [basePath='../../../'] - The base path where .env files are located. Defaults to '../../'.
 */
export function configureDotEnv(basePath = "./") {
    const normalizedBasePath = basePath.endsWith("/") ? basePath : `${basePath}/`;

    ENV_FILES.forEach(file => {
        dotenv.config({ path: `${normalizedBasePath}${file}` });
    });
}
