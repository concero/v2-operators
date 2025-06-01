"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "decodeLogs", {
    enumerable: true,
    get: function() {
        return decodeLogs;
    }
});
var _viem = require("viem");
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
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function decodeLogs(logs, abi) {
    var decodedLogs = [];
    logs.forEach(function(log) {
        try {
            var decodedLog = (0, _viem.decodeEventLog)({
                abi: abi,
                data: log.data,
                topics: log.topics,
                strict: true
            });
            decodedLogs.push(_object_spread({}, log, decodedLog));
        } catch (error) {
            if (_instanceof(error, _viem.AbiEventSignatureNotFoundError)) {
                return; // Skip logs outside of ABI
            } else {
                throw error;
            }
        }
    });
    return decodedLogs;
}
