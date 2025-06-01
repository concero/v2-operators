import process from "process";
/**
 * Gets all log levels from both legacy and new environment variable formats
 * Prioritizes the new LOG_LEVEL_* format over the legacy LOG_LEVELS_GRANULAR format
 */ export function getGranularLogLevels() {
    var logLevels = {};
    var LOG_LEVEL_PREFIX = "LOG_LEVEL_";
    Object.keys(process.env).forEach(function(key) {
        if (key.startsWith(LOG_LEVEL_PREFIX) && key !== "LOG_LEVEL_DEFAULT") {
            var componentName = key.substring(LOG_LEVEL_PREFIX.length);
            var level = process.env[key]; // Direct access is more reliable than getOptionalEnvVar
            if (componentName && level) {
                logLevels[componentName] = level;
                console.log("[getGranularLogLevels] Component-specific log level: ".concat(componentName, "=").concat(level));
            }
        }
    });
    return logLevels;
}
