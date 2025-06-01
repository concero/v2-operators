"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get getEnvAddress () {
        return getEnvAddress;
    },
    get getEnvVar () {
        return getEnvVar;
    }
});
var _process = /*#__PURE__*/ _interop_require_default(require("process"));
var _constants = require("../../constants");
var _formatting = require("./formatting");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getEnvVar(key) {
    var value = _process.default.env[key];
    if (value === undefined || value === "") throw new Error("Missing environment variable ".concat(key));
    return value;
}
function getEnvAddress(prefix, networkName) {
    var getNetworkEnvKey = require("@concero/contract-utils").getNetworkEnvKey;
    var searchKey = networkName ? "".concat(_constants.envPrefixes[prefix], "_").concat(getNetworkEnvKey(networkName)) : _constants.envPrefixes[prefix];
    var value = getEnvVar(searchKey);
    var friendlyName = "".concat(prefix, "(").concat((0, _formatting.shorten)(value), ")");
    return [
        value,
        friendlyName
    ];
}
