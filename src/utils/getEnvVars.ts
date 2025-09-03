import process from 'process';

export function getEnvBigint(key: string, defaultValue?: bigint): bigint {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Required environment variable "${key}" is not set.`);
    }
    try {
        return BigInt(value);
    } catch {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Environment variable "${key}" must be a bigint, got "${value}".`);
    }
}

export function getEnvInt(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Required environment variable "${key}" is not set.`);
    }
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Environment variable "${key}" must be an integer, got "${value}".`);
    }
    return parsed;
}

export function getEnvBool(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Required environment variable "${key}" is not set.`);
    }
    const lowered = value.toLowerCase();
    if (lowered === 'true') return true;
    if (lowered === 'false') return false;

    if (defaultValue !== undefined) return defaultValue;
    throw new Error(
        `Environment variable "${key}" must be "true" or "false" (case-insensitive), got "${value}".`,
    );
}

export function getEnvString(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value) {
        if (defaultValue !== undefined) return defaultValue;
        throw new Error(`Required environment variable "${key}" is not set.`);
    }
    return value;
}
