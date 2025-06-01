"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BlockManagerRegistry", {
    enumerable: true,
    get: function() {
        return BlockManagerRegistry;
    }
});
var _ = require("../utils/");
var _BlockManager = require("./BlockManager");
var _ManagerBase = require("./ManagerBase");
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
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
var BlockManagerRegistry = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(BlockManagerRegistry, ManagerBase);
    function BlockManagerRegistry(blockCheckpointManager, networkManager, viemClientManager, rpcManager) {
        _class_call_check(this, BlockManagerRegistry);
        var _this;
        _this = _call_super(this, BlockManagerRegistry), _define_property(_this, "blockManagers", new Map()), _define_property(_this, "blockCheckpointManager", void 0), _define_property(_this, "networkManager", void 0), _define_property(_this, "viemClientManager", void 0), _define_property(_this, "rpcManager", void 0), _define_property(_this, "logger", void 0);
        _this.blockCheckpointManager = blockCheckpointManager;
        _this.networkManager = networkManager;
        _this.viemClientManager = viemClientManager;
        _this.rpcManager = rpcManager;
        _this.logger = _.Logger.getInstance().getLogger("BlockManagerRegistry");
        return _this;
    }
    _create_class(BlockManagerRegistry, [
        {
            key: "onNetworksUpdated",
            value: function onNetworksUpdated(networks) {
                var _this = this;
                this.logger.info("Networks updated, syncing BlockManagers for ".concat(networks.length, " networks"));
                this.updateBlockManagers(networks).catch(function(error) {
                    _this.logger.error("Failed to sync BlockManagers after network update", error);
                });
            }
        },
        {
            key: "ensureBlockManagerForNetwork",
            value: function ensureBlockManagerForNetwork(network) {
                return _async_to_generator(function() {
                    var publicClient, blockManager, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                // If we already have a BlockManager for this network, return it
                                if (this.blockManagers.has(network.name)) {
                                    this.logger.debug("Using existing BlockManager for network ".concat(network.name));
                                    return [
                                        2,
                                        this.blockManagers.get(network.name)
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
                                // Ensure RPC URLs are available for this network
                                return [
                                    4,
                                    this.rpcManager.ensureRpcsForNetwork(network)
                                ];
                            case 2:
                                _state.sent();
                                // Get the client with the now-available RPC URLs
                                publicClient = this.viemClientManager.getClients(network).publicClient;
                                return [
                                    4,
                                    this.createBlockManager(network, publicClient)
                                ];
                            case 3:
                                blockManager = _state.sent();
                                return [
                                    2,
                                    blockManager
                                ];
                            case 4:
                                error = _state.sent();
                                this.logger.error("Failed to create BlockManager for network ".concat(network.name), error);
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
            key: "updateBlockManagers",
            value: function updateBlockManagers(networks) {
                return _async_to_generator(function() {
                    var _this, currentNetworkNames, newNetworkNames, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, networkName, blockManager, newNetworks, results;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _this = this;
                                if (!this.initialized) return [
                                    2
                                ];
                                this.logger.info("Syncing BlockManagers for ".concat(networks.length, " active networks"));
                                currentNetworkNames = new Set(this.blockManagers.keys());
                                newNetworkNames = new Set(networks.map(function(network) {
                                    return network.name;
                                }));
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                try {
                                    // Remove BlockManagers for networks that are no longer active
                                    for(_iterator = currentNetworkNames[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                        networkName = _step.value;
                                        if (!newNetworkNames.has(networkName)) {
                                            this.logger.info("Removing BlockManager for inactive network ".concat(networkName));
                                            blockManager = this.blockManagers.get(networkName);
                                            if (blockManager && "dispose" in blockManager) {
                                                blockManager.dispose();
                                            }
                                            this.blockManagers.delete(networkName);
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
                                // Create BlockManagers for new networks in parallel
                                newNetworks = networks.filter(function(network) {
                                    return !currentNetworkNames.has(network.name);
                                });
                                if (!(newNetworks.length > 0)) return [
                                    3,
                                    2
                                ];
                                this.logger.debug("Creating ".concat(newNetworks.length, " new BlockManagers in parallel"));
                                return [
                                    4,
                                    Promise.all(newNetworks.map(function(network) {
                                        return _this.ensureBlockManagerForNetwork(network);
                                    }))
                                ];
                            case 1:
                                results = _state.sent();
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
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(BlockManagerRegistry.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    var activeNetworks, error;
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
                                    4,
                                    ,
                                    5
                                ]);
                                // Register as a network update listener
                                this.networkManager.registerUpdateListener(this);
                                return [
                                    4,
                                    _superprop_get_initialize().call(_this1)
                                ];
                            case 2:
                                _state.sent();
                                this.logger.debug("Initialized");
                                // Perform the initial sync of BlockManagers with active networks
                                activeNetworks = this.networkManager.getActiveNetworks();
                                this.logger.debug("Starting initial sync for ".concat(activeNetworks.length, " networks"));
                                return [
                                    4,
                                    this.updateBlockManagers(activeNetworks)
                                ];
                            case 3:
                                _state.sent();
                                return [
                                    3,
                                    5
                                ];
                            case 4:
                                error = _state.sent();
                                this.logger.error("Failed to initialize", error);
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
            key: "createBlockManager",
            value: function createBlockManager(network, publicClient) {
                return _async_to_generator(function() {
                    var blockManager;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.blockManagers.has(network.name)) {
                                    return [
                                        2,
                                        this.blockManagers.get(network.name)
                                    ];
                                }
                                return [
                                    4,
                                    _BlockManager.BlockManager.create(network, publicClient, this.blockCheckpointManager)
                                ];
                            case 1:
                                blockManager = _state.sent();
                                this.blockManagers.set(network.name, blockManager);
                                this.logger.debug("Created BlockManager for network ".concat(network.name));
                                return [
                                    2,
                                    blockManager
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "getBlockManager",
            value: function getBlockManager(networkName) {
                if (this.blockManagers.has(networkName)) {
                    return this.blockManagers.get(networkName);
                }
                this.logger.warn("BlockManager for ".concat(networkName, " not found"));
                return null;
            }
        },
        {
            key: "getAllBlockManagers",
            value: function getAllBlockManagers() {
                return Array.from(this.blockManagers.values());
            }
        },
        {
            key: "getAllManagedNetworks",
            value: function getAllManagedNetworks() {
                return Array.from(this.blockManagers.keys());
            }
        },
        {
            key: "getLatestBlockForChain",
            value: function getLatestBlockForChain(networkName) {
                return _async_to_generator(function() {
                    var blockManager;
                    return _ts_generator(this, function(_state) {
                        blockManager = this.getBlockManager(networkName);
                        if (!blockManager) {
                            this.logger.error("BlockManager for ".concat(networkName, " not found"));
                            return [
                                2,
                                null
                            ];
                        }
                        return [
                            2,
                            blockManager.getLatestBlock()
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                if (this.initialized) {
                    this.networkManager.unregisterUpdateListener(this);
                    var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        // Properly dispose all block managers
                        for(var _iterator = this.blockManagers.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            var _step_value = _sliced_to_array(_step.value, 2), networkName = _step_value[0], blockManager = _step_value[1];
                            if ("dispose" in blockManager) {
                                blockManager.dispose();
                            }
                            this.logger.debug("Disposed BlockManager for ".concat(networkName));
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
                    this.blockManagers.clear();
                    _get(_get_prototype_of(BlockManagerRegistry.prototype), "dispose", this).call(this);
                    this.logger.debug("Disposed");
                }
            }
        }
    ], [
        {
            key: "createInstance",
            value: //TODO: attempt to refactor createInstance to a base class
            function createInstance(blockCheckpointManager, networkManager, viemClientManager, rpcManager) {
                BlockManagerRegistry.instance = new BlockManagerRegistry(blockCheckpointManager, networkManager, viemClientManager, rpcManager);
                return BlockManagerRegistry.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!BlockManagerRegistry.instance) {
                    throw new Error("BlockManagerRegistry is not initialized. Call createInstance() first.");
                }
                return BlockManagerRegistry.instance;
            }
        }
    ]);
    return BlockManagerRegistry;
}(_ManagerBase.ManagerBase);
_define_property(BlockManagerRegistry, "instance", void 0);
