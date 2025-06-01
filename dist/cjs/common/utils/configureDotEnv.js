"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "configureDotEnv", {
    enumerable: true,
    get: function() {
        return configureDotEnv;
    }
});
var _dotenv = /*#__PURE__*/ _interop_require_wildcard(require("dotenv"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
var ENV_FILES = [
    ".env",
    ".env.wallets",
    ".env.deployments.testnet",
    ".env.deployments.mainnet"
];
function configureDotEnv() {
    var basePath = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "./";
    var normalizedBasePath = basePath.endsWith("/") ? basePath : "".concat(basePath, "/");
    ENV_FILES.forEach(function(file) {
        _dotenv.config({
            path: "".concat(normalizedBasePath).concat(file)
        });
    });
}
configureDotEnv();
