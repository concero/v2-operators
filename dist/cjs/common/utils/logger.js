"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Logger", {
    enumerable: true,
    get: function() {
        return Logger;
    }
});
var _winston = /*#__PURE__*/ _interop_require_default(require("winston"));
var _winstondailyrotatefile = /*#__PURE__*/ _interop_require_default(require("winston-daily-rotate-file"));
var _globalConfig = require("../../constants/globalConfig");
var _ManagerBase = require("../managers/ManagerBase");
function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
}
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
        var info = gen[key](arg);
        var value = info.value;
    } catch (error) {
        reject(error);
        return;
    }
    if (info.done) {
        resolve(value);
    } else {
        Promise.resolve(value).then(_next, _throw);
    }
}
function _async_to_generator(fn) {
    return function() {
        var self = this, args = arguments;
        return new Promise(function(resolve, reject) {
            var gen = fn.apply(self, args);
            function _next(value) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
            }
            function _throw(err) {
                asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
            }
            _next(undefined);
        });
    };
}
function _call_super(_this, derived, args) {
    derived = _get_prototype_of(derived);
    return _possible_constructor_return(_this, _is_native_reflect_construct() ? Reflect.construct(derived, args || [], _get_prototype_of(_this).constructor) : derived.apply(_this, args));
}
function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
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
function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
        _get = Reflect.get;
    } else {
        _get = function get(target, property, receiver) {
            var base = _super_prop_base(target, property);
            if (!base) return;
            var desc = Object.getOwnPropertyDescriptor(base, property);
            if (desc.get) {
                return desc.get.call(receiver || target);
            }
            return desc.value;
        };
    }
    return _get(target, property, receiver || target);
}
function _get_prototype_of(o) {
    _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
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
function _possible_constructor_return(self, call) {
    if (call && (_type_of(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assert_this_initialized(self);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _super_prop_base(object, property) {
    while(!Object.prototype.hasOwnProperty.call(object, property)){
        object = _get_prototype_of(object);
        if (object === null) break;
    }
    return object;
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _is_native_reflect_construct() {
    try {
        var result = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (_) {}
    return (_is_native_reflect_construct = function() {
        return !!result;
    })();
}
function _ts_generator(thisArg, body) {
    var f, y, t, _ = {
        label: 0,
        sent: function() {
            if (t[0] & 1) throw t[1];
            return t[1];
        },
        trys: [],
        ops: []
    }, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
    }), g;
    function verb(n) {
        return function(v) {
            return step([
                n,
                v
            ]);
        };
    }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while(g && (g = 0, op[0] && (_ = 0)), _)try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [
                op[0] & 2,
                t.value
            ];
            switch(op[0]){
                case 0:
                case 1:
                    t = op;
                    break;
                case 4:
                    _.label++;
                    return {
                        value: op[1],
                        done: false
                    };
                case 5:
                    _.label++;
                    y = op[1];
                    op = [
                        0
                    ];
                    continue;
                case 7:
                    op = _.ops.pop();
                    _.trys.pop();
                    continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                        _ = 0;
                        continue;
                    }
                    if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                        _.label = op[1];
                        break;
                    }
                    if (op[0] === 6 && _.label < t[1]) {
                        _.label = t[1];
                        t = op;
                        break;
                    }
                    if (t && _.label < t[2]) {
                        _.label = t[2];
                        _.ops.push(op);
                        break;
                    }
                    if (t[2]) _.ops.pop();
                    _.trys.pop();
                    continue;
            }
            op = body.call(thisArg, _);
        } catch (e) {
            op = [
                6,
                e
            ];
            y = 0;
        } finally{
            f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return {
            value: op[0] ? op[1] : void 0,
            done: true
        };
    }
}
var Logger = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(Logger, ManagerBase);
    function Logger() {
        _class_call_check(this, Logger);
        var _this;
        _this = _call_super(this, Logger), _define_property(_this, "baseLogger", void 0), _define_property(_this, "consumerLoggers", new Map());
        _this.baseLogger = _this.createBaseLogger();
        return _this;
    }
    _create_class(Logger, [
        {
            key: "createBaseLogger",
            value: function createBaseLogger() {
                var logFormat = _winston.default.format.combine(_winston.default.format.colorize({
                    level: true
                }), _winston.default.format.timestamp({
                    format: "MM-DD HH:mm:ss"
                }), _winston.default.format.printf(function(_param) {
                    var level = _param.level, message = _param.message, timestamp = _param.timestamp, consumer = _param.consumer, meta = _object_without_properties(_param, [
                        "level",
                        "message",
                        "timestamp",
                        "consumer"
                    ]);
                    var prefix = consumer ? "".concat(consumer) : "";
                    var formattedMessage = (typeof message === "undefined" ? "undefined" : _type_of(message)) === "object" ? JSON.stringify(message, null, 2) : message;
                    var formattedMeta = meta && Object.keys(meta).length ? JSON.stringify(meta, null, 2) : "";
                    return "".concat(timestamp, " ").concat(level, " ").concat(prefix, ": ").concat(formattedMessage, " ").concat(formattedMeta).trim();
                }));
                var logger = _winston.default.createLogger({
                    level: "debug",
                    format: _winston.default.format.json(),
                    transports: [
                        new _winstondailyrotatefile.default({
                            level: "debug",
                            dirname: _globalConfig.globalConfig.LOGGER.LOG_DIR,
                            filename: "log-%DATE%.log",
                            datePattern: "YYYY-MM-DD",
                            maxSize: _globalConfig.globalConfig.LOGGER.LOG_MAX_SIZE,
                            maxFiles: _globalConfig.globalConfig.LOGGER.LOG_MAX_FILES
                        }),
                        new _winstondailyrotatefile.default({
                            level: "error",
                            dirname: _globalConfig.globalConfig.LOGGER.LOG_DIR,
                            filename: "error-%DATE%.log",
                            datePattern: "YYYY-MM-DD",
                            maxSize: _globalConfig.globalConfig.LOGGER.LOG_MAX_SIZE,
                            maxFiles: _globalConfig.globalConfig.LOGGER.LOG_MAX_FILES
                        })
                    ]
                });
                if (process.env.NODE_ENV !== "production") {
                    logger.add(new _winston.default.transports.Console({
                        level: "debug",
                        format: logFormat
                    }));
                }
                return logger;
            }
        },
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(Logger.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        if (this.initialized) return [
                            2
                        ];
                        _superprop_get_initialize().call(_this1);
                        this.getLogger("Logger").info("Initialized");
                        return [
                            2
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "getLogger",
            value: function getLogger(consumerName) {
                var cacheKey = consumerName || "__default__";
                if (this.consumerLoggers.has(cacheKey)) {
                    return this.consumerLoggers.get(cacheKey);
                }
                var logger = this.createConsumerLogger(consumerName);
                this.consumerLoggers.set(cacheKey, logger);
                return logger;
            }
        },
        {
            key: "createConsumerLogger",
            value: function createConsumerLogger(consumerName) {
                var _this = this;
                var getLogLevel = function() {
                    if (!consumerName) {
                        return _globalConfig.globalConfig.LOGGER.LOG_LEVEL_DEFAULT;
                    }
                    return _globalConfig.globalConfig.LOGGER.LOG_LEVELS_GRANULAR[consumerName] || _globalConfig.globalConfig.LOGGER.LOG_LEVEL_DEFAULT;
                };
                // Map log levels to numeric values for comparison
                var logLevelValue = {
                    error: 0,
                    warn: 1,
                    info: 2,
                    debug: 3
                };
                // Only log if the message level is <= configured level
                var shouldLog = function(messageLevel) {
                    var configuredLevel = getLogLevel();
                    var configLevelValue = logLevelValue[configuredLevel] || 2; // Default to info
                    var messageLevelValue = logLevelValue[messageLevel] || 0; // Default to error
                    return messageLevelValue <= configLevelValue;
                };
                var logLevel = getLogLevel();
                return {
                    error: function(message) {
                        for(var _len = arguments.length, meta = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                            meta[_key - 1] = arguments[_key];
                        }
                        _this.baseLogger.error(message, consumerName ? _object_spread({
                            consumer: consumerName
                        }, meta) : meta);
                    },
                    warn: function(message) {
                        for(var _len = arguments.length, meta = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                            meta[_key - 1] = arguments[_key];
                        }
                        if (shouldLog("warn")) {
                            _this.baseLogger.warn(message, consumerName ? _object_spread({
                                consumer: consumerName
                            }, meta) : meta);
                        }
                    },
                    info: function(message) {
                        for(var _len = arguments.length, meta = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                            meta[_key - 1] = arguments[_key];
                        }
                        if (shouldLog("info")) {
                            _this.baseLogger.info(message, consumerName ? _object_spread({
                                consumer: consumerName
                            }, meta) : meta);
                        }
                    },
                    debug: function(message) {
                        for(var _len = arguments.length, meta = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++){
                            meta[_key - 1] = arguments[_key];
                        }
                        if (shouldLog("debug")) {
                            _this.baseLogger.debug(message, consumerName ? _object_spread({
                                consumer: consumerName
                            }, meta) : meta);
                        }
                    }
                };
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                this.consumerLoggers.clear();
                _get(_get_prototype_of(Logger.prototype), "dispose", this).call(this);
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance() {
                if (!Logger.instance) {
                    Logger.instance = new Logger();
                }
                return Logger.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!Logger.instance) {
                    throw new Error("Logger is not initialized. Call createInstance() first.");
                }
                return Logger.instance;
            }
        }
    ]);
    return Logger;
}(_ManagerBase.ManagerBase);
_define_property(Logger, "instance", void 0);
