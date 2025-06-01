"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TxMonitor", {
    enumerable: true,
    get: function() {
        return TxMonitor;
    }
});
var _utils = require("../utils");
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
var TransactionStatus = /*#__PURE__*/ function(TransactionStatus) {
    TransactionStatus["Pending"] = "pending";
    TransactionStatus["Confirmed"] = "confirmed";
    TransactionStatus["Finalized"] = "finalized";
    TransactionStatus["Dropped"] = "dropped";
    TransactionStatus["Reorged"] = "reorged";
    TransactionStatus["Failed"] = "failed";
    return TransactionStatus;
}(TransactionStatus || {});
var TxMonitor = /*#__PURE__*/ function() {
    "use strict";
    function TxMonitor(viemClientManager, txFinalityCallback, txReorgCallback) {
        _class_call_check(this, TxMonitor);
        _define_property(this, "transactions", new Map());
        _define_property(this, "viemClientManager", void 0);
        _define_property(this, "disposed", false);
        _define_property(this, "txFinalityCallback", void 0);
        _define_property(this, "txReorgCallback", void 0);
        _define_property(this, "logger", void 0);
        this.viemClientManager = viemClientManager;
        this.txFinalityCallback = txFinalityCallback;
        this.txReorgCallback = txReorgCallback;
        this.logger = _utils.Logger.getInstance().getLogger("TxMonitor");
        this.logger.info("initialized");
    }
    _create_class(TxMonitor, [
        {
            key: "addTransaction",
            value: function addTransaction(txHash, managedTx) {
                if (this.transactions.has(txHash)) {
                    this.logger.debug("Transaction ".concat(txHash, " is already being monitored"));
                    return;
                }
                if (managedTx.txHash !== txHash) {
                    this.logger.error("Transaction hash mismatch: ".concat(txHash, " vs ").concat(managedTx.txHash));
                    return;
                }
                var monitoredTx = {
                    txHash: txHash,
                    chainName: managedTx.chainName,
                    messageId: managedTx.messageId,
                    blockNumber: managedTx.submissionBlock,
                    firstSeen: Date.now(),
                    lastChecked: Date.now(),
                    status: "pending",
                    managedTxId: managedTx.id
                };
                this.transactions.set(txHash, monitoredTx);
                this.logger.debug("Started monitoring tx ".concat(txHash, " on ").concat(managedTx.chainName) + (managedTx.messageId ? " for message ".concat(managedTx.messageId) : ""));
            }
        },
        {
            key: "checkTransactionsInRange",
            value: function checkTransactionsInRange(network, startBlock, endBlock) {
                return _async_to_generator(function() {
                    var _network_finalityConfirmations, finalityConfirmations, finalityBlockNumber, txsToCheck, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, tx, err;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (this.disposed) return [
                                    2
                                ];
                                finalityConfirmations = (_network_finalityConfirmations = network.finalityConfirmations) !== null && _network_finalityConfirmations !== void 0 ? _network_finalityConfirmations : 12;
                                finalityBlockNumber = endBlock - BigInt(finalityConfirmations);
                                // Only process transactions that:
                                // 1. Belong to this network
                                // 2. Are pending
                                // 3. Have a block number
                                // 4. Their block number + finality confirmations <= endBlock (potentially ready for finality)
                                txsToCheck = Array.from(this.transactions.values()).filter(function(tx) {
                                    return tx.chainName === network.name && tx.status === "pending" && tx.blockNumber !== null && tx.blockNumber <= finalityBlockNumber;
                                });
                                if (txsToCheck.length === 0) return [
                                    2
                                ];
                                this.logger.debug("Checking ".concat(txsToCheck.length, " transactions for finality on ").concat(network.name, " at block ").concat(endBlock));
                                _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    6,
                                    7,
                                    8
                                ]);
                                _iterator = txsToCheck[Symbol.iterator]();
                                _state.label = 2;
                            case 2:
                                if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                                    3,
                                    5
                                ];
                                tx = _step.value;
                                return [
                                    4,
                                    this.checkTransaction(tx, finalityBlockNumber, network)
                                ];
                            case 3:
                                _state.sent();
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
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "checkTransaction",
            value: function checkTransaction(tx, finalityBlockNumber, network) {
                return _async_to_generator(function() {
                    var publicClient, txInfo, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                if (!tx.blockNumber) return [
                                    2
                                ];
                                // Skip if the transaction's block hasn't reached finality yet
                                if (tx.blockNumber > finalityBlockNumber) {
                                    return [
                                        2
                                    ];
                                }
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    7,
                                    ,
                                    8
                                ]);
                                publicClient = this.viemClientManager.getClients(network).publicClient;
                                return [
                                    4,
                                    publicClient.getTransaction({
                                        hash: tx.txHash
                                    })
                                ];
                            case 2:
                                txInfo = _state.sent();
                                if (!!txInfo) return [
                                    3,
                                    4
                                ];
                                return [
                                    4,
                                    this.handleMissingTransaction(tx, network)
                                ];
                            case 3:
                                _state.sent();
                                return [
                                    2
                                ];
                            case 4:
                                if (txInfo.blockNumber && tx.blockNumber !== txInfo.blockNumber) {
                                    this.logger.info("Transaction ".concat(tx.txHash, " block number changed from ").concat(tx.blockNumber, " to ").concat(txInfo.blockNumber, " (potential reorg)"));
                                    tx.blockNumber = txInfo.blockNumber;
                                    // If the new block number hasn't reached finality yet, keep monitoring
                                    if (txInfo.blockNumber > finalityBlockNumber) {
                                        tx.lastChecked = Date.now();
                                        return [
                                            2
                                        ];
                                    }
                                }
                                // At this point we know the transaction is confirmed with sufficient confirmations
                                tx.status = "finalized";
                                this.txFinalityCallback(tx.txHash, tx.chainName);
                                if (!tx.messageId) return [
                                    3,
                                    6
                                ];
                                return [
                                    4,
                                    this.finalizeMessageTransactions(tx.messageId)
                                ];
                            case 5:
                                _state.sent();
                                _state.label = 6;
                            case 6:
                                this.transactions.delete(tx.txHash);
                                this.logger.info("Transaction ".concat(tx.txHash, " has reached finality on ").concat(network.name));
                                tx.lastChecked = Date.now();
                                return [
                                    3,
                                    8
                                ];
                            case 7:
                                error = _state.sent();
                                this.logger.error("Error checking transaction ".concat(tx.txHash, ":"), error);
                                return [
                                    3,
                                    8
                                ];
                            case 8:
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "handleMissingTransaction",
            value: function handleMissingTransaction(tx, network) {
                return _async_to_generator(function() {
                    var newTxHash;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                tx.status = "reorged";
                                this.logger.info("Transaction ".concat(tx.txHash, " not found on chain ").concat(network.name, ", potential reorg"));
                                return [
                                    4,
                                    this.txReorgCallback(tx.txHash, tx.chainName)
                                ];
                            case 1:
                                newTxHash = _state.sent();
                                if (newTxHash) {
                                    this.transactions.delete(tx.txHash);
                                    this.logger.info("Transaction ".concat(tx.txHash, " replaced with ").concat(newTxHash));
                                } else {
                                    tx.status = "dropped";
                                    this.logger.warn("Failed to resubmit transaction ".concat(tx.txHash, " after reorg"));
                                }
                                return [
                                    2
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "finalizeMessageTransactions",
            value: function finalizeMessageTransactions(messageId) {
                return _async_to_generator(function() {
                    var relatedTxs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, tx;
                    return _ts_generator(this, function(_state) {
                        relatedTxs = Array.from(this.transactions.values()).filter(function(tx) {
                            return tx.messageId === messageId;
                        });
                        _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                        try {
                            for(_iterator = relatedTxs[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                tx = _step.value;
                                if (tx.status === "pending") {
                                    this.logger.info("Finalizing related transaction ".concat(tx.txHash, " for message ").concat(messageId));
                                    tx.status = "finalized";
                                    this.txFinalityCallback(tx.txHash, tx.chainName);
                                    this.transactions.delete(tx.txHash);
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
            key: "getMonitoredTransactions",
            value: function getMonitoredTransactions(chainName) {
                if (chainName) {
                    return Array.from(this.transactions.values()).filter(function(tx) {
                        return tx.chainName === chainName;
                    });
                }
                return Array.from(this.transactions.values());
            }
        },
        {
            key: "getTransactionsByMessageId",
            value: function getTransactionsByMessageId() {
                var result = new Map();
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.transactions.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var tx = _step.value;
                        if (!tx.messageId) continue;
                        var existing = result.get(tx.messageId) || [];
                        existing.push(tx);
                        result.set(tx.messageId, existing);
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
            key: "dispose",
            value: function dispose() {
                this.disposed = true;
                this.transactions.clear();
                this.logger.info("Disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(viemClientManager, txFinalityCallback, txReorgCallback) {
                TxMonitor.instance = new TxMonitor(viemClientManager, txFinalityCallback, txReorgCallback);
                return TxMonitor.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!TxMonitor.instance) {
                    throw new Error("TxMonitor is not initialized. Call createInstance() first.");
                }
                return TxMonitor.instance;
            }
        }
    ]);
    return TxMonitor;
}();
_define_property(TxMonitor, "instance", void 0);
