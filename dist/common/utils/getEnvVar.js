import process from "process";
import { envPrefixes } from "../../constants";
import { shorten } from "./formatting";
export function getEnvVar(key) {
    var value = process.env[key];
    if (value === undefined || value === "") throw new Error("Missing environment variable ".concat(key));
    return value;
}
export function getEnvAddress(prefix, networkName) {
    var getNetworkEnvKey = require("@concero/contract-utils").getNetworkEnvKey;
    var searchKey = networkName ? "".concat(envPrefixes[prefix], "_").concat(getNetworkEnvKey(networkName)) : envPrefixes[prefix];
    var value = getEnvVar(searchKey);
    var friendlyName = "".concat(prefix, "(").concat(shorten(value), ")");
    return [
        value,
        friendlyName
    ];
}
