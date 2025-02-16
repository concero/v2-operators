import process from "process";
import { shorten } from "./formatting";
import { envPrefixes, networkEnvKeys } from "../constants";
function getEnvVar(key) {
    var value = process.env[key];
    if (value === undefined) throw new Error("Missing required environment variable ".concat(key));
    if (value === "") throw new Error("".concat(key, " must not be empty"));
    return value;
}
function getEnvAddress(prefix, networkName) {
    var searchKey = networkName ? "".concat(envPrefixes[prefix], "_").concat(networkEnvKeys[networkName]) : envPrefixes[prefix];
    var value = getEnvVar(searchKey);
    var friendlyName = "".concat(prefix, "(").concat(shorten(value), ")");
    return [
        value,
        friendlyName
    ];
}
export { getEnvVar, getEnvAddress };
