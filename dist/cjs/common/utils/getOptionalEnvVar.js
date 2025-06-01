/**
 * Gets an environment variable without throwing an error if it doesn't exist
 * @param key The environment variable key
 * @param defaultValue Optional default value to return if the environment variable is not set
 * @returns The environment variable value or undefined/default if not set
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getOptionalEnvVar", {
    enumerable: true,
    get: function() {
        return getOptionalEnvVar;
    }
});
function getOptionalEnvVar(key, defaultValue) {
    var value = process.env[key];
    return value !== undefined && value !== "" ? value : defaultValue;
}
