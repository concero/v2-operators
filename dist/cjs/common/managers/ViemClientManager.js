"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ViemClientManager", {
    enumerable: true,
    get: function() {
        return ViemClientManager;
    }
});
var _viem = require("viem");
var _accounts = require("viem/accounts");
var _constants = require("../../constants");
var _utils = require("../utils");
var _ManagerBase = require("./ManagerBase");
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
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
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
var ViemClientManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(ViemClientManager, ManagerBase);
    function ViemClientManager(rpcManager) {
        _class_call_check(this, ViemClientManager);
        var _this;
        _this = _call_super(this, ViemClientManager), _define_property(_this, "clients", new Map()), _define_property(_this, "rpcManager", void 0), _define_property(_this, "logger", void 0);
        _this.rpcManager = rpcManager;
        _this.logger = _utils.Logger.getInstance().getLogger("ViemClientManager");
        return _this;
    }
    _create_class(ViemClientManager, [
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(ViemClientManager.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.initialized) return [
                                    2
                                ];
                                // Register as RPC update listener
                                this.rpcManager.registerRpcUpdateListener(this);
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
            key: "createTransport",
            value: function createTransport(chain) {
                var rpcUrls = this.rpcManager.getRpcsForNetwork(chain.name);
                if (!rpcUrls || rpcUrls.length === 0) {
                    throw new Error("No RPC URLs available for chain ".concat(chain.name));
                }
                return (0, _viem.fallback)(rpcUrls.map(function(url) {
                    return (0, _utils.createCustomHttpTransport)(url);
                }), _object_spread_props(_object_spread({}, _constants.globalConfig.VIEM.FALLBACK_TRANSPORT_OPTIONS), {
                    shouldThrow: function(error) {
                        if (_instanceof(error, _viem.HttpRequestError) || _instanceof(error, _viem.RpcRequestError) || _instanceof(error, _viem.TransactionNotFoundError) || _instanceof(error, _viem.UnknownRpcError) || _instanceof(error, _viem.UnknownNodeError) || _instanceof(error, _viem.InvalidInputRpcError) || _instanceof(error, _viem.MethodNotFoundRpcError)) {
                            return false;
                        } else if (_instanceof(error, _viem.ContractFunctionExecutionError)) {
                            if (error.details.includes("the method eth_sendRawTransaction does not exist")) {
                                return false;
                            }
                        }
                        return true;
                    }
                }));
            }
        },
        {
            key: "initializeClients",
            value: function initializeClients(chain) {
                var privateKey = (0, _utils.getEnvVar)("OPERATOR_PRIVATE_KEY");
                var account = (0, _accounts.privateKeyToAccount)("0x".concat(privateKey));
                var transport = this.createTransport(chain);
                var publicClient = (0, _viem.createPublicClient)({
                    transport: transport,
                    chain: chain.viemChain,
                    batch: {
                        multicall: true
                    }
                });
                var walletClient = (0, _viem.createWalletClient)({
                    transport: transport,
                    chain: chain.viemChain,
                    account: account
                });
                return {
                    publicClient: publicClient,
                    walletClient: walletClient,
                    account: account
                };
            }
        },
        {
            key: "getClients",
            value: function getClients(chain) {
                if (!this.initialized) {
                    throw new Error("ViemClientManager not properly initialized");
                }
                var cachedClients = this.clients.get(chain.name);
                if (cachedClients) {
                    return cachedClients;
                }
                var newClients = this.initializeClients(chain);
                this.clients.set(chain.name, newClients);
                return newClients;
            }
        },
        {
            key: "onRpcUrlsUpdated",
            value: function onRpcUrlsUpdated(networks) {
                this.resetClientsForNetworks(networks);
            }
        },
        {
            key: "resetClientsForNetworks",
            value: function resetClientsForNetworks(networks) {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = networks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var network = _step.value;
                        try {
                            this.clients.delete(network.name);
                        } catch (error) {
                            this.logger.error("Failed to update viem clients for ".concat(network.name, ":"), error);
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
                this.logger.debug("Viem clients reset for ".concat(networks.map(function(n) {
                    return n.name;
                }).join(", ")));
            }
        },
        {
            key: "onNetworksUpdated",
            value: function onNetworksUpdated(networks) {
            // We don't need to reset clients here as RpcManager will trigger onRpcUrlsUpdated
            // which will handle the client resets
            }
        },
        {
            key: "updateClientsForNetworks",
            value: function updateClientsForNetworks(networks) {
                return _async_to_generator(function() {
                    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, network, newClients;
                    return _ts_generator(this, function(_state) {
                        _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                        try {
                            for(_iterator = networks[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                network = _step.value;
                                try {
                                    newClients = this.initializeClients(network);
                                    this.clients.set(network.name, newClients);
                                    this.logger.debug("Updated clients for chain ".concat(network.name));
                                } catch (error) {
                                    this.logger.error("Failed to update clients for chain ".concat(network.name), error);
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
                if (this.rpcManager) {
                    this.rpcManager.unregisterRpcUpdateListener(this);
                }
                this.clients.clear();
                _get(_get_prototype_of(ViemClientManager.prototype), "dispose", this).call(this);
                ViemClientManager.instance = undefined;
                this.logger.debug("Disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(rpcManager) {
                ViemClientManager.instance = new ViemClientManager(rpcManager);
                return ViemClientManager.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!ViemClientManager.instance) {
                    throw new Error("ViemClientManager is not initialized. Call createInstance() first.");
                }
                return ViemClientManager.instance;
            }
        }
    ]);
    return ViemClientManager;
}(_ManagerBase.ManagerBase);
_define_property(ViemClientManager, "instance", void 0);
