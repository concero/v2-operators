export function parseGranularLogLevels(levelsStr: string): Record<string, string> {
    const logLevels: Record<string, string> = {};

    if (!levelsStr) return logLevels;

    levelsStr.split(",").forEach(item => {
        const [component, level] = item.split(":");
        if (component && level) {
            logLevels[component.trim()] = level.trim();
        }
    });

    return logLevels;
}
