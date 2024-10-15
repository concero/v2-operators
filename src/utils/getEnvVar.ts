import { type env } from "../types/env";
import process from "process";
import { shorten } from "./formatting";
import { envPrefixes, networkEnvKeys } from "../constants";
import { Address } from "viem";
import { type EnvPrefixes } from "../types/envPrefixes";
import { ConceroNetworkNames } from "../types/ConceroNetwork";

function getEnvVar(key: keyof env): string {
    const value = process.env[key];
    if (value === undefined) throw new Error(`Missing required environment variable ${key}`);
    if (value === "") throw new Error(`${key} must not be empty`);
    return value;
}

function getEnvAddress(prefix: keyof EnvPrefixes, networkName?: ConceroNetworkNames): [Address, string] {
    const searchKey = networkName ? `${envPrefixes[prefix]}_${networkEnvKeys[networkName]}` : envPrefixes[prefix];
    const value = getEnvVar(searchKey as keyof env) as Address;
    const friendlyName = `${prefix}(${shorten(value)})`;

    return [value, friendlyName];
}

export { getEnvVar, getEnvAddress };
