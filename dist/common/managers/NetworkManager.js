function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
}
function _array_without_holes(arr) {
    if (Array.isArray(arr)) return _array_like_to_array(arr);
}
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
function _iterable_to_array(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _iterable_to_array_limit(arr, i) {
    var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
    if (_i == null) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _s, _e;
    try {
        for(_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true){
            _arr.push(_s.value);
            if (i && _arr.length === i) break;
        }
    } catch (err) {
        _d = true;
        _e = err;
    } finally{
        try {
            if (!_n && _i["return"] != null) _i["return"]();
        } finally{
            if (_d) throw _e;
        }
    }
    return _arr;
}
function _non_iterable_rest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _non_iterable_spread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _super_prop_base(object, property) {
    while(!Object.prototype.hasOwnProperty.call(object, property)){
        object = _get_prototype_of(object);
        if (object === null) break;
    }
    return object;
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
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
import { fetchNetworkConfigs } from "../utils";
import { getEnvVar, localhostViemChain, Logger } from "../utils/";
import { ManagerBase } from "./ManagerBase";
export var NetworkManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(NetworkManager, ManagerBase);
    function NetworkManager(rpcManager, deploymentsManager) {
        _class_call_check(this, NetworkManager);
        var _this;
        _this = _call_super(this, NetworkManager), _define_property(_this, "mainnetNetworks", {}), _define_property(_this, "testnetNetworks", {}), _define_property(_this, "allNetworks", {}), _define_property(_this, "activeNetworks", []), _define_property(_this, "updateIntervalId", null), _define_property(_this, "rpcManager", null), _define_property(_this, "deploymentsManager", null), _define_property(_this, "updateListeners", []), _define_property(_this, "logger", void 0);
        _this.rpcManager = rpcManager || null;
        _this.deploymentsManager = deploymentsManager || null;
        _this.logger = Logger.getInstance().getLogger("NetworkManager");
        if (_this.rpcManager && "onNetworksUpdated" in _this.rpcManager) {
            _this.registerUpdateListener(_this.rpcManager);
        }
        if (_this.deploymentsManager && "onNetworksUpdated" in _this.deploymentsManager) {
            _this.registerUpdateListener(_this.deploymentsManager);
        }
        return _this;
    }
    _create_class(NetworkManager, [
        {
            key: "initialize",
            value: function initialize() {
                return _async_to_generator(function() {
                    var error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.initialized) return [
                                    2
                                ];
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    3,
                                    ,
                                    4
                                ]);
                                return [
                                    4,
                                    this.updateNetworks()
                                ];
                            case 2:
                                _state.sent();
                                this.setupUpdateCycle();
                                this.initialized = true;
                                this.logger.debug("Initialized");
                                return [
                                    3,
                                    4
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("Failed to initialize networks:", error);
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
            key: "registerUpdateListener",
            value: function registerUpdateListener(listener) {
                var existingIndex = this.updateListeners.findIndex(function(existing) {
                    return existing.constructor.name === listener.constructor.name;
                });
                if (existingIndex === -1) {
                    this.updateListeners.push(listener);
                // this.logger.debug(
                //     `Registered update listener: ${listener.constructor.name}`,
                // );
                } else {
                    this.logger.warn("Update listener already registered: ".concat(listener.constructor.name));
                }
            }
        },
        {
            key: "unregisterUpdateListener",
            value: function unregisterUpdateListener(listener) {
                var index = this.updateListeners.indexOf(listener);
                if (index !== -1) {
                    this.updateListeners.splice(index, 1);
                }
            }
        },
        {
            key: "getMainnetNetworks",
            value: function getMainnetNetworks() {
                return _object_spread({}, this.mainnetNetworks);
            }
        },
        {
            key: "getTestnetNetworks",
            value: function getTestnetNetworks() {
                return _object_spread({}, this.testnetNetworks);
            }
        },
        {
            key: "getAllNetworks",
            value: function getAllNetworks() {
                return _object_spread({}, this.allNetworks);
            }
        },
        {
            key: "getActiveNetworks",
            value: function getActiveNetworks() {
                return _to_consumable_array(this.activeNetworks);
            }
        },
        {
            key: "getNetworkById",
            value: function getNetworkById(chainId) {
                var network = Object.values(this.allNetworks).find(function(network) {
                    return network.id === chainId;
                });
                if (!network) {
                    throw new Error("Network with chain ID ".concat(chainId, " not found"));
                }
                return network;
            }
        },
        {
            key: "getNetworkByName",
            value: function getNetworkByName(name) {
                var network = Object.values(this.allNetworks).find(function(network) {
                    return network.name === name;
                });
                if (!network) {
                    throw new Error('Network with name "'.concat(name, '" not found'));
                }
                return network;
            }
        },
        {
            key: "getNetworkBySelector",
            value: function getNetworkBySelector(selector) {
                var network = Object.values(this.allNetworks).find(function(network) {
                    return network.chainSelector === selector;
                });
                if (!network) {
                    throw new Error('Network with selector "'.concat(selector, '" not found'));
                }
                return network;
            }
        },
        {
            key: "getVerifierNetwork",
            value: function getVerifierNetwork() {
                if (globalConfig.NETWORK_MODE === "mainnet") {
                    return this.mainnetNetworks["arbitrum"];
                } else if (globalConfig.NETWORK_MODE === "testnet") {
                    return this.testnetNetworks["arbitrumSepolia"];
                } else if (globalConfig.NETWORK_MODE === "localhost") {
                    return this.testnetNetworks["localhost"];
                } else {
                    throw new Error("Unsupported network mode: ".concat(globalConfig.NETWORK_MODE));
                }
            }
        },
        {
            key: "forceUpdate",
            value: function forceUpdate() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    this.updateNetworks()
                                ];
                            case 1:
                                _state.sent();
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "setupUpdateCycle",
            value: function setupUpdateCycle() {
                var _this = this;
                if (this.updateIntervalId) {
                    clearInterval(this.updateIntervalId);
                }
                this.updateIntervalId = setInterval(function() {
                    return _this.updateNetworks().catch(function(err) {
                        return _this.logger.error("Network update failed:", err);
                    });
                }, globalConfig.NETWORK_MANAGER.NETWORK_UPDATE_INTERVAL_MS);
            }
        },
        {
            key: "updateNetworks",
            value: function updateNetworks() {
                return _async_to_generator(function() {
                    var _ref, fetchedMainnet, fetchedTestnet, operatorPK, error;
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
                                    fetchNetworkConfigs()
                                ];
                            case 1:
                                _ref = _state.sent(), fetchedMainnet = _ref.mainnetNetworks, fetchedTestnet = _ref.testnetNetworks;
                                operatorPK = getEnvVar("OPERATOR_PRIVATE_KEY");
                                this.mainnetNetworks = this.createNetworkConfig(fetchedMainnet, "mainnet", [
                                    operatorPK
                                ]);
                                this.testnetNetworks = _object_spread({}, this.createNetworkConfig(fetchedTestnet, "testnet", [
                                    operatorPK
                                ]));
                                this.allNetworks = _object_spread({}, this.testnetNetworks, this.mainnetNetworks);
                                this.activeNetworks = this.filterNetworks(globalConfig.NETWORK_MODE);
                                this.logger.debug("Networks updated - Active networks: ".concat(this.activeNetworks.length));
                                this.notifyListeners();
                                return [
                                    3,
                                    3
                                ];
                            case 2:
                                error = _state.sent();
                                this.logger.error("Failed to update networks:", error);
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
            key: "notifyListeners",
            value: function notifyListeners() {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.updateListeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var listener = _step.value;
                        try {
                            listener.onNetworksUpdated(this.activeNetworks);
                        } catch (error) {
                            this.logger.error("Error in network update listener:", error);
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
            key: "createNetworkConfig",
            value: function createNetworkConfig(networks, networkType, accounts) {
                return Object.fromEntries(Object.entries(networks).map(function(param) {
                    var _param = _sliced_to_array(param, 2), key = _param[0], network = _param[1];
                    var networkKey = key;
                    return [
                        networkKey,
                        {
                            name: network.name || networkKey,
                            type: networkType,
                            id: network.chainId,
                            accounts: accounts,
                            chainSelector: network.chainSelector || network.chainId.toString(),
                            confirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
                            viemChain: network.viemChain
                        }
                    ];
                }));
            }
        },
        {
            key: "getTestingNetworks",
            value: function getTestingNetworks(operatorPK) {
                return {
                    localhost: {
                        name: "localhost",
                        type: "localhost",
                        id: 1,
                        accounts: [
                            operatorPK
                        ],
                        chainSelector: "1",
                        confirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
                        viemChain: localhostViemChain
                    },
                    localhostPolygon: {
                        name: "localhost",
                        type: "localhost",
                        id: 137,
                        accounts: [
                            operatorPK
                        ],
                        chainSelector: "137",
                        confirmations: globalConfig.TX_MANAGER.DEFAULT_CONFIRMATIONS,
                        viemChain: localhostViemChain
                    }
                };
            }
        },
        {
            key: "filterNetworks",
            value: function filterNetworks(networkType) {
                var networks = [];
                var ignoredIds = globalConfig.IGNORED_NETWORK_IDS || [];
                var whitelistedIds = globalConfig.WHITELISTED_NETWORK_IDS[networkType] || [];
                switch(networkType){
                    case "localhost":
                        networks = Object.values(this.getTestingNetworks(getEnvVar("OPERATOR_PRIVATE_KEY")));
                        break;
                    case "testnet":
                        networks = Object.values(this.testnetNetworks);
                        break;
                    case "mainnet":
                        networks = Object.values(this.mainnetNetworks);
                        break;
                }
                networks = networks.filter(function(network) {
                    return !ignoredIds.includes(network.id);
                });
                if (whitelistedIds.length > 0) {
                    networks = networks.filter(function(network) {
                        return whitelistedIds.includes(network.id);
                    });
                }
                return networks;
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                if (this.updateIntervalId) {
                    clearInterval(this.updateIntervalId);
                    this.updateIntervalId = null;
                }
                this.updateListeners = [];
                _get(_get_prototype_of(NetworkManager.prototype), "dispose", this).call(this);
            }
        }
    ], [
        {
            key: "getInstance",
            value: function getInstance() {
                return NetworkManager.instance;
            }
        },
        {
            key: "createInstance",
            value: function createInstance(rpcManager, deploymentsManager) {
                this.instance = new NetworkManager(rpcManager, deploymentsManager);
                return this.instance;
            }
        }
    ]);
    return NetworkManager;
}(ManagerBase);
_define_property(NetworkManager, "instance", void 0);
