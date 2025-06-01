import * as dotenv from "dotenv";
var ENV_FILES = [
    ".env",
    ".env.wallets",
    ".env.deployments.testnet",
    ".env.deployments.mainnet"
];
/**
 * Configures the dotenv with paths relative to a base directory.
 *
 * @param {string} [basePath='../../../'] - The base path where .env files are located. Defaults to
 *   '../../'. Default is `'../../../'`
 */ export function configureDotEnv() {
    var basePath = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "./";
    var normalizedBasePath = basePath.endsWith("/") ? basePath : "".concat(basePath, "/");
    ENV_FILES.forEach(function(file) {
        dotenv.config({
            path: "".concat(normalizedBasePath).concat(file)
        });
    });
}
configureDotEnv();
