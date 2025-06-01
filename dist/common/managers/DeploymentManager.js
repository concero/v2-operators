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
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
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
import { globalConfig } from "../../constants";
import { getEnvVar } from "../utils/getEnvVar";
import { HttpClient } from "../utils/httpClient";
import { Logger } from "../utils/logger";
import { ManagerBase } from "./ManagerBase";
export var DeploymentManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(DeploymentManager, ManagerBase);
    function DeploymentManager() {
        _class_call_check(this, DeploymentManager);
        var _this;
        _this = _call_super(this, DeploymentManager), _define_property(_this, "conceroRoutersMapByChainName", {}), _define_property(_this, "conceroVerifier", void 0), _define_property(_this, "httpClient", void 0), _define_property(_this, "logger", void 0);
        _this.httpClient = HttpClient.getQueueInstance();
        _this.logger = Logger.getInstance().getLogger("DeploymentManager");
        return _this;
    }
    _create_class(DeploymentManager, [
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(DeploymentManager.prototype), "initialize", _this);
                };
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
                                    _superprop_get_initialize().call(_this1)
                                ];
                            case 2:
                                _state.sent();
                                this.logger.debug("Initialized");
                                return [
                                    3,
                                    4
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("Failed to initialize:", error);
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
            key: "getRouterByChainName",
            value: function getRouterByChainName(chainName) {
                return _async_to_generator(function() {
                    var router, updatedRouter;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.isLocalhostEnv()) {
                                    return [
                                        2,
                                        getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST")
                                    ];
                                }
                                router = this.conceroRoutersMapByChainName[chainName];
                                if (router !== undefined) return [
                                    2,
                                    router
                                ];
                                return [
                                    4,
                                    this.updateDeployments()
                                ];
                            case 1:
                                _state.sent();
                                updatedRouter = this.conceroRoutersMapByChainName[chainName];
                                if (!updatedRouter) {
                                    throw new Error("Router not found for chain: ".concat(chainName));
                                }
                                return [
                                    2,
                                    updatedRouter
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "getConceroRouters",
            value: function getConceroRouters() {
                return _async_to_generator(function() {
                    var routers;
                    return _ts_generator(this, function(_state) {
                        if (this.isLocalhostEnv()) {
                            return [
                                2,
                                _define_property({}, getEnvVar("LOCALHOST_FORK_CHAIN_ID"), getEnvVar("CONCERO_ROUTER_PROXY_LOCALHOST"))
                            ];
                        }
                        routers = this.conceroRoutersMapByChainName;
                        return [
                            2,
                            routers
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "getConceroVerifier",
            value: function getConceroVerifier() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.isLocalhostEnv()) {
                                    return [
                                        2,
                                        getEnvVar("CONCERO_VERIFIER_PROXY_LOCALHOST")
                                    ];
                                }
                                if (this.conceroVerifier !== undefined) return [
                                    2,
                                    this.conceroVerifier
                                ];
                                return [
                                    4,
                                    this.updateDeployments()
                                ];
                            case 1:
                                _state.sent();
                                if (!this.conceroVerifier) {
                                    throw new Error("Concero verifier address not found after update");
                                }
                                return [
                                    2,
                                    this.conceroVerifier
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "updateDeployments",
            value: function updateDeployments() {
                return _async_to_generator(function() {
                    var now, deployments, deploymentsEnvArr, conceroRouterDeploymentsEnv, routerMap, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, deploymentEnv, _deploymentEnv_split, name, address, networkName, verifierEntry, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                now = Date.now();
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
                                    this.httpClient.get(globalConfig.URLS.CONCERO_DEPLOYMENTS, {
                                        responseType: "text"
                                    })
                                ];
                            case 2:
                                deployments = _state.sent();
                                deploymentsEnvArr = deployments.split("\n");
                                conceroRouterDeploymentsEnv = deploymentsEnvArr.filter(function(d) {
                                    return d.startsWith("CONCERO_ROUTER_PROXY") && !d.startsWith("CONCERO_ROUTER_PROXY_ADMIN");
                                });
                                routerMap = {};
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                try {
                                    for(_iterator = conceroRouterDeploymentsEnv[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                        deploymentEnv = _step.value;
                                        _deploymentEnv_split = _sliced_to_array(deploymentEnv.split("="), 2), name = _deploymentEnv_split[0], address = _deploymentEnv_split[1];
                                        networkName = this.extractNetworkName(name);
                                        if (networkName) {
                                            routerMap[networkName] = address;
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
                                this.conceroRoutersMapByChainName = routerMap;
                                verifierEntry = deploymentsEnvArr.find(function(d) {
                                    var networkSuffix = globalConfig.NETWORK_MODE === "testnet" ? "ARBITRUM_SEPOLIA" : "ARBITRUM";
                                    return d.startsWith("CONCERO_VERIFIER_PROXY_".concat(networkSuffix));
                                });
                                if (verifierEntry) {
                                    this.conceroVerifier = verifierEntry.split("=")[1];
                                }
                                this.lastUpdateTime = now;
                                this.logger.debug("Deployments updated");
                                return [
                                    3,
                                    4
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("Failed to update deployments:", error);
                                throw new Error("Failed to update deployments: ".concat(_instanceof(error, Error) ? error.message : String(error)));
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
            key: "onNetworksUpdated",
            value: function onNetworksUpdated() {
                var _this = this;
                // this.logger.debug("Received onNetworksUpdated");
                this.updateDeployments().catch(function(err) {
                    return _this.logger.error("Failed to update deployments after network update:", err);
                });
            }
        },
        {
            key: "extractNetworkName",
            value: function extractNetworkName(key) {
                var prefix = "CONCERO_ROUTER_PROXY_";
                var parts = key.slice(prefix.length).toLowerCase().split("_");
                return parts[0] + parts.slice(1).map(function(part) {
                    return part.charAt(0).toUpperCase() + part.slice(1);
                }).join("");
            }
        },
        {
            key: "isLocalhostEnv",
            value: function isLocalhostEnv() {
                return globalConfig.NETWORK_MODE === "localhost";
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                _get(_get_prototype_of(DeploymentManager.prototype), "dispose", this).call(this);
                this.logger.debug("Disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance() {
                DeploymentManager.instance = new DeploymentManager();
                return DeploymentManager.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!DeploymentManager.instance) {
                    throw new Error("DeploymentManager is not initialized. Call createInstance() first.");
                }
                return DeploymentManager.instance;
            }
        }
    ]);
    return DeploymentManager;
}(ManagerBase);
_define_property(DeploymentManager, "instance", void 0);
