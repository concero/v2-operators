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
import { Logger } from "../utils/";
import { ManagerBase } from "./ManagerBase";
export var TxManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(TxManager, ManagerBase);
    function TxManager(networkManager, viemClientManager, blockManagerRegistry, txWriter, txReader, txMonitor) {
        _class_call_check(this, TxManager);
        var _this;
        _this = _call_super(this, TxManager), _define_property(_this, "txWriter", void 0), _define_property(_this, "txReader", void 0), _define_property(_this, "txMonitor", void 0), _define_property(_this, "networkManager", void 0), _define_property(_this, "viemClientManager", void 0), _define_property(_this, "blockManagerRegistry", void 0), _define_property(_this, "logger", void 0), _define_property(_this, "logWatcher", {
            create: function(contractAddress, chainName, onLogs, event) {
                return _this.txReader.logWatcher.create(contractAddress, chainName, onLogs, event);
            },
            remove: function(watcherId) {
                return _this.txReader.logWatcher.remove(watcherId);
            }
        });
        _this.networkManager = networkManager;
        _this.viemClientManager = viemClientManager;
        _this.blockManagerRegistry = blockManagerRegistry;
        _this.txWriter = txWriter;
        _this.txReader = txReader;
        _this.txMonitor = txMonitor;
        _this.logger = Logger.getInstance().getLogger("TxManager");
        return _this;
    }
    _create_class(TxManager, [
        {
            key: "initialize",
            value: function initialize() {
                var _this = this;
                var _this1 = this, _superprop_get_initialize = function() {
                    return _get(_get_prototype_of(TxManager.prototype), "initialize", _this);
                };
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        _superprop_get_initialize().call(_this1);
                        this.logger.info("initialized");
                        return [
                            2
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "callContract",
            value: function callContract(walletClient, publicClient, network, params) {
                return _async_to_generator(function() {
                    var managedTx;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    this.txWriter.callContract(walletClient, publicClient, network, params)
                                ];
                            case 1:
                                managedTx = _state.sent();
                                this.txMonitor.addTransaction(managedTx.txHash, managedTx);
                                return [
                                    2,
                                    managedTx
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "onTxReorg",
            value: // Transaction Monitoring Methods
            function onTxReorg(txHash, chainName) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            this.txWriter.onTxReorg(txHash, chainName)
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "onTxFinality",
            value: function onTxFinality(txHash, chainName) {
                this.txWriter.onTxFinality(txHash, chainName);
            }
        },
        {
            key: "getLogs",
            value: // Log Reading Methods
            function getLogs(query, network) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            this.txReader.getLogs(query, network)
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "getPendingTransactions",
            value: // Transaction status methods
            function getPendingTransactions(chainName) {
                return this.txWriter.getPendingTransactions(chainName);
            }
        },
        {
            key: "getTransactionsByMessageId",
            value: function getTransactionsByMessageId(messageId) {
                return this.txWriter.getTransactionsByMessageId(messageId);
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                this.txWriter.dispose();
                this.txReader.dispose();
                this.txMonitor.dispose();
                this.logger.info("disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(networkManager, viemClientManager, blockManagerRegistry, txWriter, txReader, txMonitor) {
                if (!TxManager.instance) {
                    TxManager.instance = new TxManager(networkManager, viemClientManager, blockManagerRegistry, txWriter, txReader, txMonitor);
                }
                return TxManager.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!TxManager.instance) {
                    throw new Error("TxManager is not initialized. Call createInstance() first.");
                }
                return TxManager.instance;
            }
        }
    ]);
    return TxManager;
}(ManagerBase);
_define_property(TxManager, "instance", void 0);
