"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "getGranularLogLevels", {
    enumerable: true,
    get: function() {
        return getGranularLogLevels;
    }
});
var _process = /*#__PURE__*/ _interop_require_default(require("process"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function getGranularLogLevels() {
    var logLevels = {};
    var LOG_LEVEL_PREFIX = "LOG_LEVEL_";
    Object.keys(_process.default.env).forEach(function(key) {
        if (key.startsWith(LOG_LEVEL_PREFIX) && key !== "LOG_LEVEL_DEFAULT") {
            var componentName = key.substring(LOG_LEVEL_PREFIX.length);
            var level = _process.default.env[key]; // Direct access is more reliable than getOptionalEnvVar
            if (componentName && level) {
                logLevels[componentName] = level;
                console.log("[getGranularLogLevels] Component-specific log level: ".concat(componentName, "=").concat(level));
            }
        }
    });
    return logLevels;
}
