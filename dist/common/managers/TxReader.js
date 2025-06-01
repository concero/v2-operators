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
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
}
function _to_consumable_array(arr) {
    return _array_without_holes(arr) || _iterable_to_array(arr) || _unsupported_iterable_to_array(arr) || _non_iterable_spread();
}
function _unsupported_iterable_to_array(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _array_like_to_array(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(n);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _array_like_to_array(o, minLen);
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
import { v4 as uuidv4 } from "uuid";
import { Logger } from "../utils";
export var TxReader = /*#__PURE__*/ function() {
    "use strict";
    function TxReader(networkManager, viemClientManager, blockManagerRegistry) {
        var _this = this;
        _class_call_check(this, TxReader);
        _define_property(this, "logWatchers", new Map());
        _define_property(this, "cachedLogs", new Map());
        _define_property(this, "blockManagerUnwatchers", new Map());
        _define_property(this, "logger", void 0);
        _define_property(this, "networkManager", void 0);
        _define_property(this, "viemClientManager", void 0);
        _define_property(this, "blockManagerRegistry", void 0);
        _define_property(this, "logWatcher", {
            create: function(contractAddress, chainName, onLogs, event) {
                var id = uuidv4();
                var watcher = {
                    id: id,
                    chainName: chainName,
                    contractAddress: contractAddress,
                    event: event,
                    callback: onLogs
                };
                _this.logWatchers.set(id, watcher);
                _this.logger.debug("Created log watcher for ".concat(chainName, ":").concat(contractAddress, " (").concat(event.name, ")"));
                return id;
            },
            remove: function(watcherId) {
                var result = _this.logWatchers.delete(watcherId);
                if (result) {
                    _this.logger.info("Removed log watcher ".concat(watcherId));
                } else {
                    _this.logger.warn("Failed to remove log watcher ".concat(watcherId, " (not found)"));
                }
                return result;
            }
        });
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.blockManagerRegistry = blockManagerRegistry;
        this.logger = Logger.getInstance().getLogger("TxReader");
    }
    _create_class(TxReader, [
        {
            key: "initialize",
            value: function initialize() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                return [
                                    4,
                                    this.subscribeToBlockUpdates()
                                ];
                            case 1:
                                _state.sent();
                                this.logger.info("Initialized");
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "subscribeToBlockUpdates",
            value: function subscribeToBlockUpdates() {
                return _async_to_generator(function() {
                    var _this, activeNetworks, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _this1, _loop, _iterator, _step;
                    return _ts_generator(this, function(_state) {
                        _this = this;
                        activeNetworks = this.networkManager.getActiveNetworks();
                        _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                        try {
                            _loop = function() {
                                var network = _step.value;
                                var blockManager = _this1.blockManagerRegistry.getBlockManager(network.name);
                                var unwatcher = blockManager.watchBlocks({
                                    onBlockRange: function(startBlock, endBlock) {
                                        return _async_to_generator(function() {
                                            return _ts_generator(this, function(_state) {
                                                switch(_state.label){
                                                    case 0:
                                                        return [
                                                            4,
                                                            this.fetchLogsForWatchers(network.name, startBlock, endBlock)
                                                        ];
                                                    case 1:
                                                        _state.sent();
                                                        return [
                                                            2
                                                        ];
                                                }
                                            });
                                        }).call(_this);
                                    }
                                });
                                _this1.blockManagerUnwatchers.set(network.name, unwatcher);
                            };
                            for(_iterator = activeNetworks[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true)_this1 = this, _loop();
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
            key: "fetchLogsForWatchers",
            value: function fetchLogsForWatchers(chainName, fromBlock, toBlock) {
                return _async_to_generator(function() {
                    var watchersForChain, network, chainCache, watchersByContract, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step_value, contractAddress, contractWatchers, events, logs, logsByEvent, _iteratorNormalCompletion1, _didIteratorError1, _iteratorError1, _iterator1, _step1, log, eventName, logId, existingLogs, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, watcher, _watcher_event, eventName1, watcherLogs, error, err, error1, err;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                this.logger.debug("fetching logs for blocks ".concat(fromBlock, " - ").concat(toBlock));
                                watchersForChain = Array.from(this.logWatchers.values()).filter(function(watcher) {
                                    return watcher.chainName === chainName;
                                });
                                if (watchersForChain.length === 0) return [
                                    2
                                ];
                                network = this.networkManager.getNetworkByName(chainName);
                                if (!network) {
                                    this.logger.warn("Unknown network: ".concat(chainName));
                                    return [
                                        2
                                    ];
                                }
                                // Initialize cache for this chain if it doesn't exist
                                if (!this.cachedLogs.has(chainName)) {
                                    this.cachedLogs.set(chainName, new Map());
                                }
                                chainCache = this.cachedLogs.get(chainName);
                                watchersByContract = this.groupWatchersByContract(watchersForChain);
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    18,
                                    19,
                                    20
                                ]);
                                _iterator = watchersByContract[Symbol.iterator]();
                                _state.label = 2;
                            case 2:
                                if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                                    3,
                                    17
                                ];
                                _step_value = _sliced_to_array(_step.value, 2), contractAddress = _step_value[0], contractWatchers = _step_value[1];
                                _state.label = 3;
                            case 3:
                                _state.trys.push([
                                    3,
                                    15,
                                    ,
                                    16
                                ]);
                                events = contractWatchers.map(function(w) {
                                    return w.event;
                                });
                                return [
                                    4,
                                    this.getContractLogs(contractAddress, fromBlock, toBlock, events, network)
                                ];
                            case 4:
                                logs = _state.sent();
                                // Group logs by event name to process them in batches
                                logsByEvent = new Map();
                                _iteratorNormalCompletion1 = true, _didIteratorError1 = false, _iteratorError1 = undefined;
                                try {
                                    for(_iterator1 = logs[Symbol.iterator](); !(_iteratorNormalCompletion1 = (_step1 = _iterator1.next()).done); _iteratorNormalCompletion1 = true){
                                        log = _step1.value;
                                        eventName = log.eventName || "";
                                        logId = "".concat(log.transactionHash, ":").concat(log.logIndex);
                                        // Skip logs we've already seen
                                        if (chainCache.has(logId)) continue;
                                        chainCache.set(logId, log);
                                        existingLogs = logsByEvent.get(eventName) || [];
                                        existingLogs.push(log);
                                        logsByEvent.set(eventName, existingLogs);
                                    }
                                } catch (err) {
                                    _didIteratorError1 = true;
                                    _iteratorError1 = err;
                                } finally{
                                    try {
                                        if (!_iteratorNormalCompletion1 && _iterator1.return != null) {
                                            _iterator1.return();
                                        }
                                    } finally{
                                        if (_didIteratorError1) {
                                            throw _iteratorError1;
                                        }
                                    }
                                }
                                _iteratorNormalCompletion2 = true, _didIteratorError2 = false, _iteratorError2 = undefined;
                                _state.label = 5;
                            case 5:
                                _state.trys.push([
                                    5,
                                    12,
                                    13,
                                    14
                                ]);
                                _iterator2 = contractWatchers[Symbol.iterator]();
                                _state.label = 6;
                            case 6:
                                if (!!(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done)) return [
                                    3,
                                    11
                                ];
                                watcher = _step2.value;
                                eventName1 = ((_watcher_event = watcher.event) === null || _watcher_event === void 0 ? void 0 : _watcher_event.name) || "";
                                watcherLogs = logsByEvent.get(eventName1) || [];
                                if (!(watcherLogs.length > 0)) return [
                                    3,
                                    10
                                ];
                                _state.label = 7;
                            case 7:
                                _state.trys.push([
                                    7,
                                    9,
                                    ,
                                    10
                                ]);
                                return [
                                    4,
                                    watcher.callback(watcherLogs, network)
                                ];
                            case 8:
                                _state.sent();
                                return [
                                    3,
                                    10
                                ];
                            case 9:
                                error = _state.sent();
                                this.logger.error("Error in watcher callback (ID: ".concat(watcher.id, "):"), error);
                                return [
                                    3,
                                    10
                                ];
                            case 10:
                                _iteratorNormalCompletion2 = true;
                                return [
                                    3,
                                    6
                                ];
                            case 11:
                                return [
                                    3,
                                    14
                                ];
                            case 12:
                                err = _state.sent();
                                _didIteratorError2 = true;
                                _iteratorError2 = err;
                                return [
                                    3,
                                    14
                                ];
                            case 13:
                                try {
                                    if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                                        _iterator2.return();
                                    }
                                } finally{
                                    if (_didIteratorError2) {
                                        throw _iteratorError2;
                                    }
                                }
                                return [
                                    7
                                ];
                            case 14:
                                return [
                                    3,
                                    16
                                ];
                            case 15:
                                error1 = _state.sent();
                                this.logger.error("Error fetching logs for ".concat(contractAddress, " on ").concat(chainName, ":"), error1);
                                return [
                                    3,
                                    16
                                ];
                            case 16:
                                _iteratorNormalCompletion = true;
                                return [
                                    3,
                                    2
                                ];
                            case 17:
                                return [
                                    3,
                                    20
                                ];
                            case 18:
                                err = _state.sent();
                                _didIteratorError = true;
                                _iteratorError = err;
                                return [
                                    3,
                                    20
                                ];
                            case 19:
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return != null) {
                                        _iterator.return();
                                    }
                                } finally{
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                                return [
                                    7
                                ];
                            case 20:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "groupWatchersByContract",
            value: function groupWatchersByContract(watchers) {
                var result = new Map();
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = watchers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var watcher = _step.value;
                        var existing = result.get(watcher.contractAddress) || [];
                        existing.push(watcher);
                        result.set(watcher.contractAddress, existing);
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
                return result;
            }
        },
        {
            key: "getContractLogs",
            value: function getContractLogs(contractAddress, fromBlock, toBlock, events, network) {
                return _async_to_generator(function() {
                    var allLogs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, event, _allLogs, eventLogs, err;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (events.length === 0) return [
                                    2,
                                    []
                                ];
                                allLogs = [];
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    6,
                                    7,
                                    8
                                ]);
                                _iterator = events[Symbol.iterator]();
                                _state.label = 2;
                            case 2:
                                if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                                    3,
                                    5
                                ];
                                event = _step.value;
                                return [
                                    4,
                                    this.getLogs({
                                        address: contractAddress,
                                        event: event,
                                        fromBlock: fromBlock,
                                        toBlock: toBlock
                                    }, network)
                                ];
                            case 3:
                                eventLogs = _state.sent();
                                (_allLogs = allLogs).push.apply(_allLogs, _to_consumable_array(eventLogs));
                                _state.label = 4;
                            case 4:
                                _iteratorNormalCompletion = true;
                                return [
                                    3,
                                    2
                                ];
                            case 5:
                                return [
                                    3,
                                    8
                                ];
                            case 6:
                                err = _state.sent();
                                _didIteratorError = true;
                                _iteratorError = err;
                                return [
                                    3,
                                    8
                                ];
                            case 7:
                                try {
                                    if (!_iteratorNormalCompletion && _iterator.return != null) {
                                        _iterator.return();
                                    }
                                } finally{
                                    if (_didIteratorError) {
                                        throw _iteratorError;
                                    }
                                }
                                return [
                                    7
                                ];
                            case 8:
                                return [
                                    2,
                                    allLogs
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "getLogs",
            value: function getLogs(query, network) {
                return _async_to_generator(function() {
                    var publicClient, filter, logs, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                publicClient = this.viemClientManager.getClients(network).publicClient;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    3,
                                    ,
                                    4
                                ]);
                                filter = {
                                    address: query.address,
                                    fromBlock: query.fromBlock,
                                    toBlock: query.toBlock,
                                    event: query.event
                                };
                                if (query.args) {
                                    filter.args = query.args;
                                }
                                return [
                                    4,
                                    publicClient.getLogs(filter)
                                ];
                            case 2:
                                logs = _state.sent();
                                // console.log(query, logs);
                                return [
                                    2,
                                    logs
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("Error fetching logs on ".concat(network.name, ":"), error);
                                return [
                                    2,
                                    []
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
            key: "dispose",
            value: function dispose() {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.blockManagerUnwatchers.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var _step_value = _sliced_to_array(_step.value, 2), networkName = _step_value[0], unwatcher = _step_value[1];
                        unwatcher();
                        this.logger.info("Unsubscribed from block updates for ".concat(networkName));
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
                this.blockManagerUnwatchers.clear();
                this.logWatchers.clear();
                this.cachedLogs.clear();
                this.logger.info("Disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(networkManager, viemClientManager, blockManagerRegistry) {
                TxReader.instance = new TxReader(networkManager, viemClientManager, blockManagerRegistry);
                return TxReader.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!TxReader.instance) {
                    throw new Error("TxReader is not initialized. Call createInstance() first.");
                }
                return TxReader.instance;
            }
        }
    ]);
    return TxReader;
}();
_define_property(TxReader, "instance", void 0);
