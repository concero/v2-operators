function _object_without_properties(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
// Define log level based on the environment variable or default to 'info'
var logLevel = process.env.LOG_LEVEL || "info";
// Define common log format with timestamps and pretty print for development
var logFormat = winston.format.combine(winston.format.colorize({
    level: true
}), winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss"
}), winston.format.printf(function(_param) {
    var level = _param.level, message = _param.message, timestamp = _param.timestamp, meta = _object_without_properties(_param, [
        "level",
        "message",
        "timestamp"
    ]);
    // Handle object messages properly
    var formattedMessage = (typeof message === "undefined" ? "undefined" : _type_of(message)) === "object" ? JSON.stringify(message, null, 2) : message;
    // Ensure the meta (which includes defaultMeta like `service`) is handled separately
    var formattedMeta = meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
    return "".concat(formattedMeta, " ").concat(timestamp, " [").concat(level, "]: ").concat(formattedMessage);
}));
// Create the logger instance
var logger = winston.createLogger({
    level: logLevel,
    format: winston.format.json(),
    transports: [
        new DailyRotateFile({
            filename: "logs/log-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        }),
        new DailyRotateFile({
            level: "error",
            filename: "logs/error-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d"
        })
    ]
});
if (process.env.NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        level: logLevel,
        format: logFormat
    }));
}
// Graceful log level control for dynamic changes in environments
logger.level = logLevel;
export default logger;
