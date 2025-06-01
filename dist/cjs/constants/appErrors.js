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
    get AppErrorEnum () {
        return AppErrorEnum;
    },
    get appErrors () {
        return appErrors;
    }
});
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
var AppErrorEnum = /*#__PURE__*/ function(AppErrorEnum) {
    AppErrorEnum["ViemCreateClientFailed"] = "ViemCreateClientFailed";
    AppErrorEnum["FailedHTTPRequest"] = "FailedHTTPRequest";
    AppErrorEnum["UnknownError"] = "UnknownError";
    AppErrorEnum["UnhandledRejection"] = "UnhandledRejection";
    AppErrorEnum["UncaughtException"] = "UncaughtException";
    AppErrorEnum["EnvKeyMissing"] = "EnvKeyMissing";
    AppErrorEnum["ChainNotFound"] = "ChainNotFound";
    AppErrorEnum["InsufficientGas"] = "InsufficientGas";
    AppErrorEnum["InvalidNetworkMode"] = "InvalidNetworkMode";
    AppErrorEnum["ContractCallError"] = "ContractCallError";
    AppErrorEnum["LogDecodingFailed"] = "LogDecodingFailed";
    return AppErrorEnum;
}({});
var _obj;
var appErrors = (_obj = {}, _define_property(_obj, "ViemCreateClientFailed", {
    message: "Failed to create viem client",
    isOperational: false
}), _define_property(_obj, "FailedHTTPRequest", {
    message: "Failed to make HTTP request",
    isOperational: true
}), _define_property(_obj, "UnknownError", {
    message: "An unknown error occurred",
    isOperational: false
}), _define_property(_obj, "UnhandledRejection", {
    message: "Unhandled promise rejection",
    isOperational: true
}), _define_property(_obj, "UncaughtException", {
    message: "Uncaught exception",
    isOperational: true
}), _define_property(_obj, "EnvKeyMissing", {
    message: "Missing or empty required environment variable",
    isOperational: false
}), _define_property(_obj, "ChainNotFound", {
    message: "Chain not found",
    isOperational: false
}), _define_property(_obj, "InsufficientGas", {
    message: "Insufficient gas",
    isOperational: false
}), _define_property(_obj, "InvalidNetworkMode", {
    message: "Invalid network mode",
    isOperational: false
}), _define_property(_obj, "ContractCallError", {
    message: "Failed to call contract",
    isOperational: true
}), _define_property(_obj, "LogDecodingFailed", {
    message: "Failed to decode log",
    isOperational: true
}), _obj);
