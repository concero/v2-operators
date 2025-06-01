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
import { Logger } from "../utils";
export var BlockManager = /*#__PURE__*/ function() {
    "use strict";
    function BlockManager(initialBlock, network, publicClient, blockCheckpointManager) {
        _class_call_check(this, BlockManager);
        _define_property(this, "lastProcessedBlockNumber", void 0);
        _define_property(this, "latestBlock", null);
        _define_property(this, "publicClient", void 0);
        _define_property(this, "network", void 0);
        _define_property(this, "blockCheckpointManager", void 0);
        _define_property(this, "blockRangeHandlers", new Map());
        _define_property(this, "logger", void 0);
        _define_property(this, "isDisposed", false);
        _define_property(this, "isPolling", false);
        _define_property(this, "pollingIntervalMs", globalConfig.BLOCK_MANAGER.POLLING_INTERVAL_MS);
        _define_property(this, "pollingTimeout", null);
        this.lastProcessedBlockNumber = initialBlock;
        this.publicClient = publicClient;
        this.network = network;
        this.blockCheckpointManager = blockCheckpointManager;
        this.logger = Logger.getInstance().getLogger("BlockManager");
    }
    _create_class(BlockManager, [
        {
            key: "startPolling",
            value: function startPolling() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.isPolling) {
                                    this.logger.debug("".concat(this.network.name, ": Already polling, ignoring start request"));
                                    return [
                                        2
                                    ];
                                }
                                this.isPolling = true;
                                return [
                                    4,
                                    this.performCatchup()
                                ];
                            case 1:
                                _state.sent();
                                return [
                                    4,
                                    this.poll()
                                ];
                            case 2:
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
            key: "stopPolling",
            value: function stopPolling() {
                if (!this.isPolling) {
                    return;
                }
                this.logger.info("".concat(this.network.name, ": Stopping block polling"));
                this.isPolling = false;
                if (this.pollingTimeout) {
                    clearTimeout(this.pollingTimeout);
                    this.pollingTimeout = null;
                }
            }
        },
        {
            key: "poll",
            value: function poll() {
                return _async_to_generator(function() {
                    var _this, _, startBlock, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                _this = this;
                                if (!this.isPolling || this.isDisposed) {
                                    return [
                                        2
                                    ];
                                }
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    5,
                                    6,
                                    7
                                ]);
                                _ = this;
                                return [
                                    4,
                                    this.publicClient.getBlockNumber()
                                ];
                            case 2:
                                _.latestBlock = _state.sent();
                                if (!(this.latestBlock > this.lastProcessedBlockNumber)) return [
                                    3,
                                    4
                                ];
                                startBlock = this.lastProcessedBlockNumber + 1n;
                                return [
                                    4,
                                    this.processBlockRange(startBlock, this.latestBlock)
                                ];
                            case 3:
                                _state.sent();
                                _state.label = 4;
                            case 4:
                                return [
                                    3,
                                    7
                                ];
                            case 5:
                                error = _state.sent();
                                this.logger.error("".concat(this.network.name, ": Error in poll cycle:"), error);
                                return [
                                    3,
                                    7
                                ];
                            case 6:
                                if (this.isPolling && !this.isDisposed) {
                                    this.pollingTimeout = setTimeout(function() {
                                        return _this.poll();
                                    }, this.pollingIntervalMs);
                                }
                                return [
                                    7
                                ];
                            case 7:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "getLatestBlock",
            value: function getLatestBlock() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        return [
                            2,
                            this.latestBlock
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "processBlockRange",
            value: /**
     * Process a range of blocks by:
     * 1. Notifying all registered handlers about the new block range
     * 2. Updating the last processed block checkpoint
     */ function processBlockRange(startBlock, endBlock) {
                return _async_to_generator(function() {
                    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, handler, error, err;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                this.logger.debug("".concat(this.network.name, ": Processing ").concat(this.latestBlock - startBlock + 1n, " new blocks from ").concat(startBlock, " to ").concat(this.latestBlock));
                                if (!(this.blockRangeHandlers.size > 0)) return [
                                    3,
                                    10
                                ];
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    8,
                                    9,
                                    10
                                ]);
                                _iterator = this.blockRangeHandlers.values()[Symbol.iterator]();
                                _state.label = 2;
                            case 2:
                                if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                                    3,
                                    7
                                ];
                                handler = _step.value;
                                _state.label = 3;
                            case 3:
                                _state.trys.push([
                                    3,
                                    5,
                                    ,
                                    6
                                ]);
                                return [
                                    4,
                                    handler.onBlockRange(startBlock, endBlock)
                                ];
                            case 4:
                                _state.sent();
                                return [
                                    3,
                                    6
                                ];
                            case 5:
                                error = _state.sent();
                                this.logger.error("".concat(this.network.name, ": Error in block range handler ").concat(handler.id, ":"), error);
                                if (handler.onError) {
                                    handler.onError(error);
                                }
                                return [
                                    3,
                                    6
                                ];
                            case 6:
                                _iteratorNormalCompletion = true;
                                return [
                                    3,
                                    2
                                ];
                            case 7:
                                return [
                                    3,
                                    10
                                ];
                            case 8:
                                err = _state.sent();
                                _didIteratorError = true;
                                _iteratorError = err;
                                return [
                                    3,
                                    10
                                ];
                            case 9:
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
                            case 10:
                                return [
                                    4,
                                    this.updateLastProcessedBlock(endBlock)
                                ];
                            case 11:
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
            key: "updateLastProcessedBlock",
            value: /**
     * Update the last processed block checkpoint
     */ function updateLastProcessedBlock(blockNumber) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                // this.logger.debug(
                                //     `${this.network.name}: Updating last processed block to ${blockNumber} (previous: ${this.lastProcessedBlockNumber})`,
                                // );
                                return [
                                    4,
                                    this.blockCheckpointManager.updateLastProcessedBlock(this.network.name, blockNumber)
                                ];
                            case 1:
                                _state.sent();
                                this.lastProcessedBlockNumber = blockNumber;
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "performCatchup",
            value: /**
     * Initiates a catchup process from the current processed block to the latest block.
     * This is typically called during initialization.
     */ function performCatchup() {
                return _async_to_generator(function() {
                    var _, currentBlock, startBlock, endBlock, err;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.isDisposed) {
                                    this.logger.debug("".concat(this.network.name, ": Already disposed, skipping catchup"));
                                    return [
                                        2
                                    ];
                                }
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    6,
                                    ,
                                    7
                                ]);
                                _ = this;
                                return [
                                    4,
                                    this.publicClient.getBlockNumber()
                                ];
                            case 2:
                                _.latestBlock = _state.sent();
                                currentBlock = this.lastProcessedBlockNumber;
                                this.logger.debug("".concat(this.network.name, ": Starting catchup from block ").concat(currentBlock, ", Chain tip: ").concat(this.latestBlock));
                                _state.label = 3;
                            case 3:
                                if (!(currentBlock < this.latestBlock && !this.isDisposed)) return [
                                    3,
                                    5
                                ];
                                startBlock = currentBlock + 1n;
                                endBlock = startBlock + globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE - 1n > this.latestBlock ? this.latestBlock : startBlock + globalConfig.BLOCK_MANAGER.CATCHUP_BATCH_SIZE - 1n;
                                // Process this block range (will notify handlers)
                                return [
                                    4,
                                    this.processBlockRange(startBlock, endBlock)
                                ];
                            case 4:
                                _state.sent();
                                currentBlock = endBlock;
                                return [
                                    3,
                                    3
                                ];
                            case 5:
                                return [
                                    3,
                                    7
                                ];
                            case 6:
                                err = _state.sent();
                                this.logger.error("".concat(this.network.name, ":"), err);
                                return [
                                    3,
                                    7
                                ];
                            case 7:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "watchBlocks",
            value: /**
     * Registers a handler that will be called when new blocks are processed.
     * Returns an unregister function.
     */ function watchBlocks(options) {
                var _this = this;
                var onBlockRange = options.onBlockRange, onError = options.onError;
                var handlerId = Math.random().toString(36).substring(2, 15);
                // this.logger.debug(
                //     `${this.network.name}: Registered block range handler ${handlerId}`,
                // );
                this.blockRangeHandlers.set(handlerId, {
                    id: handlerId,
                    onBlockRange: onBlockRange,
                    onError: onError
                });
                return function() {
                    _this.logger.info("".concat(_this.network.name, ": Unregistered block range handler ").concat(handlerId));
                    _this.blockRangeHandlers.delete(handlerId);
                };
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                this.isDisposed = true;
                this.stopPolling();
                this.blockRangeHandlers.clear();
                this.logger.debug("".concat(this.network.name, ": Disposed"));
            }
        }
    ], [
        {
            key: "create",
            value: function create(network, publicClient, blockCheckpointManager) {
                return _async_to_generator(function() {
                    var initialBlock, staticLogger, savedBlock, blockManager;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                staticLogger = Logger.getInstance().getLogger("BlockManager");
                                if (!!globalConfig.BLOCK_MANAGER.USE_CHECKPOINTS) return [
                                    3,
                                    2
                                ];
                                return [
                                    4,
                                    publicClient.getBlockNumber()
                                ];
                            case 1:
                                initialBlock = _state.sent();
                                staticLogger.debug("".concat(network.name, ": Checkpoints disabled. Starting from current chain tip: ").concat(initialBlock));
                                return [
                                    3,
                                    6
                                ];
                            case 2:
                                return [
                                    4,
                                    blockCheckpointManager.getCheckpoint(network)
                                ];
                            case 3:
                                savedBlock = _state.sent();
                                if (!(savedBlock !== undefined)) return [
                                    3,
                                    4
                                ];
                                staticLogger.info("".concat(network.name, ": Resuming from previously saved block ").concat(savedBlock));
                                initialBlock = savedBlock;
                                return [
                                    3,
                                    6
                                ];
                            case 4:
                                return [
                                    4,
                                    publicClient.getBlockNumber()
                                ];
                            case 5:
                                initialBlock = _state.sent();
                                staticLogger.debug("".concat(network.name, ": No checkpoint found. Starting from current chain tip: ").concat(initialBlock));
                                _state.label = 6;
                            case 6:
                                staticLogger.debug("".concat(network.name, ": Creating new instance with initial block ").concat(initialBlock));
                                blockManager = new BlockManager(initialBlock, network, publicClient, blockCheckpointManager);
                                return [
                                    2,
                                    blockManager
                                ];
                        }
                    });
                })();
            }
        }
    ]);
    return BlockManager;
}();
