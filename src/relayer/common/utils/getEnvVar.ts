import process from "process";
import { Address } from "viem";
import { AppErrorEnum, envPrefixes, networkEnvKeys } from "../../../constants";
import { ConceroNetworkNames } from "../../../types/ConceroNetwork";
import { type env } from "../../../types/env";
import { type EnvPrefixes } from "../../../types/envPrefixes";
import { shorten } from "./formatting";

function getEnvVar(key: keyof env): string {
    const value = process.env[key];
    if (value === undefined || value === "")
        throw new Error(`Missing environment variable ${key}`);
    return value;
}

function getEnvAddress(
    prefix: keyof EnvPrefixes,
    networkName?: ConceroNetworkNames,
): [Address, string] {
    const searchKey = networkName
        ? `${envPrefixes[prefix]}_${networkEnvKeys[networkName]}`
        : envPrefixes[prefix];
    const value = getEnvVar(searchKey as keyof env) as Address;
    const friendlyName = `${prefix}(${shorten(value)})`;

    return [value, friendlyName];
}

export { getEnvAddress, getEnvVar };
