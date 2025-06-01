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
import { globalConfig } from "../../constants/";
import { Logger } from "../utils/";
import { HttpClient } from "../utils/httpClient";
import { ManagerBase } from "./ManagerBase";
export var RpcManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(RpcManager, ManagerBase);
    function RpcManager() {
        _class_call_check(this, RpcManager);
        var _this;
        _this = _call_super(this, RpcManager), _define_property(_this, "httpClient", void 0), _define_property(_this, "logger", void 0), _define_property(_this, "rpcUrls", {}), _define_property(_this, "lastUpdateTime", {}), _define_property(_this, "rpcUpdateListeners", []);
        _this.httpClient = HttpClient.getQueueInstance();
        _this.logger = Logger.getInstance().getLogger("RpcManager");
        return _this;
    }
    _create_class(RpcManager, [
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(RpcManager.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.initialized) return [
                                    2
                                ];
                                return [
                                    4,
                                    _superprop_get_initialize().call(_this1)
                                ];
                            case 1:
                                _state.sent();
                                this.logger.debug("Initialized");
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "registerRpcUpdateListener",
            value: function registerRpcUpdateListener(listener) {
                if (!this.rpcUpdateListeners.includes(listener)) {
                    this.rpcUpdateListeners.push(listener);
                }
            }
        },
        {
            key: "unregisterRpcUpdateListener",
            value: function unregisterRpcUpdateListener(listener) {
                var index = this.rpcUpdateListeners.indexOf(listener);
                if (index !== -1) {
                    this.rpcUpdateListeners.splice(index, 1);
                }
            }
        },
        {
            key: "ensureRpcsForNetwork",
            value: function ensureRpcsForNetwork(network) {
                return _async_to_generator(function() {
                    var now, lastUpdate;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                now = Date.now();
                                lastUpdate = this.lastUpdateTime[network.name] || 0;
                                if (!(!this.rpcUrls[network.name] || this.rpcUrls[network.name].length === 0)) return [
                                    3,
                                    2
                                ];
                                return [
                                    4,
                                    this.updateRpcsForNetwork(network)
                                ];
                            case 1:
                                _state.sent();
                                _state.label = 2;
                            case 2:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "fetchRpcUrls",
            value: function fetchRpcUrls(chainId, chainName, chainType) {
                return _async_to_generator(function() {
                    var rpcOverride, localhostUrl, url, chainConfig, response, urls, rpcsExtension, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    3,
                                    ,
                                    4
                                ]);
                                rpcOverride = globalConfig.RPC.OVERRIDE[chainId.toString()];
                                if (rpcOverride && rpcOverride.length) return [
                                    2,
                                    rpcOverride
                                ];
                                if (chainType === "localhost") {
                                    localhostUrl = process.env.LOCALHOST_RPC_URL;
                                    if (!localhostUrl) {
                                        throw new Error("LOCALHOST_RPC_URL environment variable is not set");
                                    }
                                    return [
                                        2,
                                        [
                                            localhostUrl
                                        ]
                                    ];
                                }
                                url = "".concat(globalConfig.URLS.CONCERO_RPCS).concat(chainType, "/").concat(chainId, "-").concat(chainName, ".json");
                                return [
                                    4,
                                    this.httpClient.get(url)
                                ];
                            case 1:
                                chainConfig = _state.sent();
                                return [
                                    4,
                                    chainConfig
                                ];
                            case 2:
                                response = _state.sent();
                                urls = response.urls;
                                rpcsExtension = globalConfig.RPC.EXTENSION[chainId.toString()];
                                if (rpcsExtension) {
                                    rpcsExtension.forEach(function(url) {
                                        urls.push(url);
                                    });
                                }
                                if (!urls) {
                                    throw new Error("Invalid RPC URL response format for chain ".concat(chainName));
                                }
                                return [
                                    2,
                                    urls
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("Error fetching RPC URLs for ".concat(chainName, ":"), error);
                                throw error;
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
            key: "updateRpcsForNetworks",
            value: function updateRpcsForNetworks(networks) {
                return _async_to_generator(function() {
                    var _this, updatePromises, updatedNetworks, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _this1, _loop, _iterator, _step;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _this = this;
                                updatePromises = [];
                                updatedNetworks = [];
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                try {
                                    _loop = function() {
                                        var network = _step.value;
                                        updatePromises.push(_this1.updateRpcsForNetwork(network).then(function() {
                                            updatedNetworks.push(network);
                                        }).catch(function(error) {
                                            _this.logger.error("Failed to update RPC for network ".concat(network.name, ":"), error);
                                        }));
                                    };
                                    for(_iterator = networks[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_this1 = this, _loop();
                                } catch (err) {
                                    _didIteratorError = true;
                                    _iteratorError = err;
                                } finally{
                                    try {
                                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                                            _iterator.return();
                                        }
                                    } finally{
                                        if (_didIteratorError) {
                                            throw _iteratorError;
                                        }
                                    }
                                }
                                return [
                                    4,
                                    Promise.allSettled(updatePromises)
                                ];
                            case 1:
                                _state.sent();
                                if (updatedNetworks.length > 0) {
                                    this.notifyRpcUpdateListeners(updatedNetworks);
                                }
                                this.logger.debug("Updated RPC URLs for ".concat(updatedNetworks.map(function(network) {
                                    return network.name;
                                }).join(", "), ": ").concat(updatedNetworks.length, " networks updated"));
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "updateRpcsForNetwork",
            value: function updateRpcsForNetwork(network) {
                return _async_to_generator(function() {
                    var urls, previousUrls, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _state.trys.push([
                                    0,
                                    2,
                                    ,
                                    3
                                ]);
                                return [
                                    4,
                                    this.fetchRpcUrls(network.id, network.name, network.type)
                                ];
                            case 1:
                                urls = _state.sent();
                                if (urls.length > 0) {
                                    previousUrls = this.rpcUrls[network.name] || [];
                                    this.rpcUrls[network.name] = urls;
                                    this.lastUpdateTime[network.name] = Date.now();
                                    // this.logger.debug(
                                    //     `Updated RPC URLs for ${network.name}: ${urls.length} URLs available`,
                                    // );
                                    if (JSON.stringify(previousUrls) !== JSON.stringify(urls)) {
                                        this.notifyRpcUpdateListeners([
                                            network
                                        ]);
                                    }
                                } else {
                                    this.logger.warn("No RPC URLs found for chain ".concat(network.name));
                                    this.rpcUrls[network.name] = [];
                                }
                                return [
                                    3,
                                    3
                                ];
                            case 2:
                                error = _state.sent();
                                this.logger.error("Failed to update RPC URLs for chain ".concat(network.name, ":"), error);
                                this.rpcUrls[network.name] = this.rpcUrls[network.name] || [];
                                throw error;
                            case 3:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "notifyRpcUpdateListeners",
            value: function notifyRpcUpdateListeners(networks) {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.rpcUpdateListeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var listener = _step.value;
                        try {
                            listener.onRpcUrlsUpdated(networks);
                        } catch (error) {
                            this.logger.error("Error in RPC update listener:", error);
                        }
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally{
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return != null) {
                            _iterator.return();
                        }
                    } finally{
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            }
        },
        {
            key: "getRpcsForNetwork",
            value: function getRpcsForNetwork(networkName) {
                return this.rpcUrls[networkName] || [];
            }
        },
        {
            key: "onNetworksUpdated",
            value: function onNetworksUpdated(networks) {
                var _this = this;
                this.updateRpcsForNetworks(networks).catch(function(err) {
                    return _this.logger.error("Failed to update RPCs after network update:", err);
                });
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance() {
                RpcManager.instance = new RpcManager();
                return RpcManager.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!RpcManager.instance) {
                    throw new Error("RpcManager is not initialized. Call createInstance() first.");
                }
                return RpcManager.instance;
            }
        }
    ]);
    return RpcManager;
}(ManagerBase);
_define_property(RpcManager, "instance", void 0);
