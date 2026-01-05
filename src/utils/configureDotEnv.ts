import * as dotenv from 'dotenv';

import * as path from 'path';

// @todo: remove
export const ENV_FILES: string[] = ['.env'];

function stripJunk(raw: string) {
    return raw
        .replace(/^\uFEFF/, '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
}

function sanitizeHexPrivateKey(raw: string | undefined): `0x${string}` {
    if (!raw) throw new Error('OPERATOR_PRIVATE_KEY is not set');

    let v = stripJunk(raw);

    if (/^[0-9a-fA-F]{64}$/.test(v)) v = '0x' + v;

    if (!/^0x[0-9a-fA-F]{64}$/.test(v)) {
        const sample = v.slice(0, 12);
        throw new Error(
            `OPERATOR_PRIVATE_KEY has invalid format. Got "${sample}..." (len=${v.length}). Expected 0x + 64 hex.`,
        );
    }
    return v as `0x${string}`;
}

function sanitizeEthAddress(raw: string | undefined): `0x${string}` {
    if (!raw) throw new Error('OPERATOR_ADDRESS is not set');

    const v = stripJunk(raw);
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
        throw new Error(`OPERATOR_ADDRESS has invalid format: "${v}". Expected 0x + 40 hex.`);
    }
    return v as `0x${string}`;
}

/**
 * Configures dotenv loading order:
 * 1) Base files from ENV_FILES (in order added)
 * 2) .env.local (optional)
 * 3) .env.development or .env.production (last, always loaded with override)
 *
 * Any other NODE_ENV values are coerced to "development".
 *
 * @param {string} [basePath='./'] - Base path where .env files are located.
 * */
export function configureDotEnv(basePath = './'): void {
    console.log({ basePath });

    const baseDir = basePath.endsWith(path.sep) ? basePath : `${basePath}${path.sep}`;
    const nodeEnvNormalized = process.env.NODE_ENV === 'production' ? 'production' : 'development';

    for (const file of ENV_FILES) {
        const p = path.resolve(baseDir, file);
        dotenv.config({ path: p, override: true });
    }

    dotenv.config({ path: path.resolve(baseDir, '.env.local'), override: true });

    dotenv.config({ path: path.resolve(baseDir, `.env.${nodeEnvNormalized}`), override: true });

    console.log({ DATABASE_URL: process.env.DATABASE_URL, processes: process.env });
    process.env.OPERATOR_PRIVATE_KEY = sanitizeHexPrivateKey(process.env.OPERATOR_PRIVATE_KEY);
    process.env.DATABASE_URL = `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.POSTGRES_DB}`;

    if (process.env.OPERATOR_ADDRESS) {
        process.env.OPERATOR_ADDRESS = sanitizeEthAddress(process.env.OPERATOR_ADDRESS);
    }
}

configureDotEnv();
