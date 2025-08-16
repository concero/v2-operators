import { Address } from 'viem';
import { type env } from '../types/env';
import { type EnvPrefixes } from '../types/envPrefixes';
export declare function getEnvVar<K extends keyof env>(key: K): env[K];
export declare function getEnvAddress(prefix: keyof EnvPrefixes, networkName?: string): [Address, string];
//# sourceMappingURL=getEnvVar.d.ts.map