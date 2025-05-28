import process from "process";

/**
 * Gets all log levels from both legacy and new environment variable formats
 * Prioritizes the new LOG_LEVEL_* format over the legacy LOG_LEVELS_GRANULAR format
 */
export function getGranularLogLevels(): Record<string, string> {
    const logLevels: Record<string, string> = {};
    const LOG_LEVEL_PREFIX = "LOG_LEVEL_";

    Object.keys(process.env).forEach(key => {
        if (key.startsWith(LOG_LEVEL_PREFIX) && key !== "LOG_LEVEL_DEFAULT") {
            const componentName = key.substring(LOG_LEVEL_PREFIX.length);
            const level = process.env[key]; // Direct access is more reliable than getOptionalEnvVar

            if (componentName && level) {
                logLevels[componentName] = level;
                console.log(
                    `[getGranularLogLevels] Component-specific log level: ${componentName}=${level}`,
                );
            }
        }
    });

    return logLevels;
}
