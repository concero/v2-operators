import * as dotenv from 'dotenv';

import * as path from 'path';

export const ENV_FILES: string[] = ['.env'];

/**
 * Configures dotenv loading order:
 * 1) Base files from ENV_FILES (in order added)
 * 2) .env.local (optional)
 * 3) .env.development or .env.production (last, always loaded with override)
 *
 * Any other NODE_ENV values are coerced to "development".
 *
 * @param {string} [basePath='./'] - Base path where .env files are located.
 */
export function configureDotEnv(basePath = './'): void {
    const baseDir = basePath.endsWith(path.sep) ? basePath : `${basePath}${path.sep}`;

    const nodeEnvNormalized = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    for (const file of ENV_FILES) {
        const p = path.resolve(baseDir, file);
        dotenv.config({ path: p, override: false });
    }

    const localFilePath = path.resolve(baseDir, '.env.local');
    dotenv.config({ path: localFilePath, override: true });

    const envFilePath = path.resolve(baseDir, `.env.${nodeEnvNormalized}`);
    dotenv.config({ path: envFilePath, override: true });
}

configureDotEnv();
