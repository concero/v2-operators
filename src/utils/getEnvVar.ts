import { shorten } from './formatting';

import process from 'process';
import { Address } from 'viem';

import { envPrefixes } from '../constants';
import { type env } from '../types/env';
import { type EnvPrefixes } from '../types/envPrefixes';

export function getEnvVar<K extends keyof env>(key: K): env[K] {
    const value = process.env[key];
    if (value === undefined || value === '') throw new Error(`Missing environment variable ${key}`);
    return value as env[K];
}

export function getEnvAddress(prefix: keyof EnvPrefixes, networkName?: string): [Address, string] {
    const { getNetworkEnvKey } = require('@concero/contract-utils');

    const searchKey = networkName
        ? `${envPrefixes[prefix]}_${getNetworkEnvKey(networkName)}`
        : envPrefixes[prefix];
    const value = getEnvVar(searchKey as keyof env) as Address;
    const friendlyName = `${prefix}(${shorten(value)})`;

    return [value, friendlyName];
}
export const getEnvBigint = (key: string, defaultValue: bigint): bigint => {
    const value = process.env[key];
    if (!value) return defaultValue;
    try {
        return BigInt(value);
    } catch {
        return defaultValue;
    }
};

export const getEnvInt = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};

export const getEnvBool = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
};

export function getEnvString(key: string, defaultValue?: string) {
    const value = process.env[key];
    return (value ?? defaultValue) as string;
}
