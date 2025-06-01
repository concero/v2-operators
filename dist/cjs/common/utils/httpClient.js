"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HttpClient", {
    enumerable: true,
    get: function() {
        return HttpClient;
    }
});
var _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
var _constants = require("../../constants");
var _managers = require("../managers");
var _AppError = require("./AppError");
var _logger = require("./logger");
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
var _globalConfig_HTTPCLIENT = _constants.globalConfig.HTTPCLIENT, RETRY_DELAY = _globalConfig_HTTPCLIENT.RETRY_DELAY, MAX_RETRIES = _globalConfig_HTTPCLIENT.MAX_RETRIES, DEFAULT_TIMEOUT = _globalConfig_HTTPCLIENT.DEFAULT_TIMEOUT;
var HttpClient = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(HttpClient, ManagerBase);
    function HttpClient(maxConcurrentRequests) {
        _class_call_check(this, HttpClient);
        var _this;
        _this = _call_super(this, HttpClient), _define_property(_this, "axiosInstance", void 0), _define_property(_this, "logger", void 0), _define_property(_this, "requestQueue", []), _define_property(_this, "activeRequests", 0), _define_property(_this, "maxConcurrentRequests", void 0);
        _this.maxConcurrentRequests = maxConcurrentRequests;
        _this.logger = _logger.Logger.getInstance().getLogger("HttpClient");
        return _this;
    }
    _create_class(HttpClient, [
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(HttpClient.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    var error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.initialized) {
                                    return [
                                        2
                                    ];
                                }
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    4,
                                    ,
                                    5
                                ]);
                                return [
                                    4,
                                    this.setupAxiosInstance()
                                ];
                            case 2:
                                _state.sent();
                                return [
                                    4,
                                    _superprop_get_initialize().call(_this1)
                                ];
                            case 3:
                                _state.sent();
                                return [
                                    3,
                                    5
                                ];
                            case 4:
                                error = _state.sent();
                                throw error;
                            case 5:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "setupAxiosInstance",
            value: function setupAxiosInstance() {
                return _async_to_generator(function() {
                    var _this;
                    return _ts_generator(this, function(_state) {
                        _this = this;
                        this.axiosInstance = _axios.default.create({
                            timeout: DEFAULT_TIMEOUT
                        });
                        this.axiosInstance.interceptors.response.use(function(response) {
                            return response;
                        }, function(error) {
                            return _async_to_generator(function() {
                                var config, logger;
                                return _ts_generator(this, function(_state) {
                                    switch(_state.label){
                                        case 0:
                                            config = error.config;
                                            logger = this.logger;
                                            if (!(config && config.__retryCount < MAX_RETRIES)) return [
                                                3,
                                                2
                                            ];
                                            config.__retryCount = config.__retryCount || 0;
                                            config.__retryCount += 1;
                                            logger.warn("Retrying request to ".concat(config.url, ". Attempt ").concat(config.__retryCount, " of ").concat(MAX_RETRIES, ". Error: ").concat(error.message));
                                            return [
                                                4,
                                                new Promise(function(resolve) {
                                                    return setTimeout(resolve, RETRY_DELAY);
                                                })
                                            ];
                                        case 1:
                                            _state.sent();
                                            return [
                                                2,
                                                this.axiosInstance(config)
                                            ];
                                        case 2:
                                            logger.error("Request to ".concat(config === null || config === void 0 ? void 0 : config.url, " failed after ").concat((config === null || config === void 0 ? void 0 : config.__retryCount) || 0, " attempts. Error: ").concat(error.message));
                                            throw new _AppError.AppError(_constants.AppErrorEnum.FailedHTTPRequest, error);
                                    }
                                });
                            }).call(_this);
                        });
                        return [
                            2
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                // Clear the request queue
                this.requestQueue = [];
                this.activeRequests = 0;
                this.axiosInstance = undefined;
                _get(_get_prototype_of(HttpClient.prototype), "dispose", this).call(this);
            }
        },
        {
            key: "processQueue",
            value: function processQueue() {
                return _async_to_generator(function() {
                    var nextRequest;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (!((this.maxConcurrentRequests === undefined || this.activeRequests < this.maxConcurrentRequests) && this.requestQueue.length > 0)) return [
                                    3,
                                    4
                                ];
                                nextRequest = this.requestQueue.shift();
                                if (!nextRequest) return [
                                    3,
                                    4
                                ];
                                this.activeRequests++;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    ,
                                    3,
                                    4
                                ]);
                                return [
                                    4,
                                    nextRequest()
                                ];
                            case 2:
                                _state.sent();
                                return [
                                    3,
                                    4
                                ];
                            case 3:
                                this.activeRequests--;
                                this.processQueue();
                                return [
                                    7
                                ];
                            case 4:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "enqueueRequest",
            value: function enqueueRequest(requestFn) {
                this.requestQueue.push(requestFn);
                this.processQueue();
            }
        },
        {
            key: "request",
            value: function request(_0, _1, _2) {
                return _async_to_generator(function(method, url) {
                    var _this, config, body;
                    var _arguments = arguments;
                    return _ts_generator(this, function(_state) {
                        _this = this;
                        config = _arguments.length > 2 && _arguments[2] !== void 0 ? _arguments[2] : {}, body = _arguments.length > 3 ? _arguments[3] : void 0;
                        if (!this.initialized || !this.axiosInstance) {
                            throw new _AppError.AppError(_constants.AppErrorEnum.FailedHTTPRequest, new Error("HttpClient not initialized"));
                        }
                        return [
                            2,
                            new Promise(function(resolve, reject) {
                                var executeRequest = function() {
                                    return _async_to_generator(function() {
                                        var response, error;
                                        return _ts_generator(this, function(_state) {
                                            switch(_state.label){
                                                case 0:
                                                    _state.trys.push([
                                                        0,
                                                        2,
                                                        ,
                                                        3
                                                    ]);
                                                    this.logger.debug("".concat(method, " request to ").concat(url, " with config: ").concat(JSON.stringify(config), " ").concat(body ? "and body: ".concat(JSON.stringify(body)) : ""));
                                                    return [
                                                        4,
                                                        this.axiosInstance.request(_object_spread({
                                                            method: method,
                                                            url: url,
                                                            data: body
                                                        }, config))
                                                    ];
                                                case 1:
                                                    response = _state.sent();
                                                    resolve(response.data);
                                                    return [
                                                        3,
                                                        3
                                                    ];
                                                case 2:
                                                    error = _state.sent();
                                                    this.logger.error("Request failed for ".concat(url, " with error:"), error);
                                                    reject(new _AppError.AppError(_constants.AppErrorEnum.FailedHTTPRequest, error));
                                                    return [
                                                        3,
                                                        3
                                                    ];
                                                case 3:
                                                    return [
                                                        2
                                                    ];
                                            }
                                        });
                                    }).call(_this);
                                };
                                _this.enqueueRequest(executeRequest);
                            })
                        ];
                    });
                }).apply(this, arguments);
            }
        },
        {
            key: "get",
            value: function get(_0) {
                return _async_to_generator(function(url) {
                    var config;
                    var _arguments = arguments;
                    return _ts_generator(this, function(_state) {
                        config = _arguments.length > 1 && _arguments[1] !== void 0 ? _arguments[1] : {};
                        return [
                            2,
                            this.request("GET", url, config)
                        ];
                    });
                }).apply(this, arguments);
            }
        },
        {
            key: "post",
            value: function post(_0, _1) {
                return _async_to_generator(function(url, body) {
                    var config;
                    var _arguments = arguments;
                    return _ts_generator(this, function(_state) {
                        config = _arguments.length > 2 && _arguments[2] !== void 0 ? _arguments[2] : {};
                        return [
                            2,
                            this.request("POST", url, config, body)
                        ];
                    });
                }).apply(this, arguments);
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(maxConcurrentRequests) {
                return new HttpClient(maxConcurrentRequests);
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!HttpClient.defaultInstance) {
                    HttpClient.defaultInstance = new HttpClient();
                }
                return HttpClient.defaultInstance;
            }
        },
        {
            key: "getQueueInstance",
            value: function getQueueInstance() {
                if (!HttpClient.queueInstance) {
                    HttpClient.queueInstance = new HttpClient(2);
                }
                return HttpClient.queueInstance;
            }
        },
        {
            key: "disposeInstances",
            value: function disposeInstances() {
                if (HttpClient.defaultInstance) {
                    HttpClient.defaultInstance.dispose();
                    HttpClient.defaultInstance = undefined;
                }
                if (HttpClient.queueInstance) {
                    HttpClient.queueInstance.dispose();
                    HttpClient.queueInstance = undefined;
                }
            }
        }
    ]);
    return HttpClient;
}(_managers.ManagerBase);
_define_property(HttpClient, "defaultInstance", void 0);
_define_property(HttpClient, "queueInstance", void 0);
