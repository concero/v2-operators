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
import { v4 as uuidv4 } from "uuid";
import { globalConfig } from "../../constants";
import { callContract, Logger } from "../utils";
var TxType = /*#__PURE__*/ function(TxType) {
    TxType["DEFAULT"] = "default";
    TxType["MESSAGE"] = "message";
    TxType["FEE"] = "fee";
    TxType["ADMIN"] = "admin";
    return TxType;
}(TxType || {});
var TxStatus = /*#__PURE__*/ function(TxStatus) {
    TxStatus["PENDING"] = "pending";
    TxStatus["SUBMITTED"] = "submitted";
    TxStatus["CONFIRMED"] = "confirmed";
    TxStatus["FINALIZED"] = "finalized";
    TxStatus["FAILED"] = "failed";
    return TxStatus;
}(TxStatus || {});
export var TxWriter = /*#__PURE__*/ function() {
    "use strict";
    function TxWriter(networkManager, viemClientManager) {
        _class_call_check(this, TxWriter);
        _define_property(this, "transactions", new Map());
        _define_property(this, "txByType", new Map([
            [
                "default",
                new Set()
            ],
            [
                "message",
                new Set()
            ],
            [
                "fee",
                new Set()
            ],
            [
                "admin",
                new Set()
            ]
        ]));
        _define_property(this, "networkManager", void 0);
        _define_property(this, "viemClientManager", void 0);
        _define_property(this, "logger", void 0);
        this.networkManager = networkManager;
        this.viemClientManager = viemClientManager;
        this.logger = Logger.getInstance().getLogger("TxWriter");
    }
    _create_class(TxWriter, [
        {
            key: "initialize",
            value: function initialize() {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        this.logger.info("Initialized");
                        return [
                            2
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "callContract",
            value: function callContract1(walletClient, publicClient, network, params) {
                return _async_to_generator(function() {
                    var txType, mockTxHash, managedTx, txHash, managedTx1, error;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                txType = this.determineTxType(params);
                                _state.label = 1;
                            case 1:
                                _state.trys.push([
                                    1,
                                    3,
                                    ,
                                    4
                                ]);
                                if (globalConfig.TX_MANAGER.DRY_RUN) {
                                    this.logger.info("[DRY_RUN][".concat(network.name, "] Contract call: ").concat(params.functionName));
                                    mockTxHash = "0xdry".concat(Date.now().toString(16));
                                    managedTx = this.createManagedTx(network, params, txType, mockTxHash);
                                    return [
                                        2,
                                        managedTx
                                    ];
                                }
                                return [
                                    4,
                                    callContract(publicClient, walletClient, params)
                                ];
                            case 2:
                                txHash = _state.sent();
                                this.logger.debug("[".concat(network.name, "] Contract call transaction hash: ").concat(txHash));
                                managedTx1 = this.createManagedTx(network, params, txType, txHash);
                                return [
                                    2,
                                    managedTx1
                                ];
                            case 3:
                                error = _state.sent();
                                this.logger.error("[".concat(network.name, "] Contract call failed: ").concat(error));
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
            key: "createManagedTx",
            value: function createManagedTx(network, params, txType, txHash) {
                var _this_txByType_get;
                var id = uuidv4();
                var managedTx = {
                    id: id,
                    chainName: network.name,
                    txHash: txHash,
                    submittedAt: Date.now(),
                    submissionBlock: null,
                    status: "submitted"
                };
                this.transactions.set(id, managedTx);
                (_this_txByType_get = this.txByType.get(txType)) === null || _this_txByType_get === void 0 ? void 0 : _this_txByType_get.add(id);
                return managedTx;
            }
        },
        {
            key: "updateTxStatus",
            value: function updateTxStatus(managedTx, status, blockNumber) {
                managedTx.status = status;
                if (blockNumber) {
                    managedTx.submissionBlock = blockNumber;
                }
            }
        },
        {
            key: "determineTxType",
            value: function determineTxType(params) {
                return _async_to_generator(function() {
                    return _ts_generator(this, function(_state) {
                        // Here you could implement more sophisticated logic to determine the tx type
                        // based on contract addresses, function names, etc.
                        return [
                            2,
                            "default"
                        ];
                    });
                })();
            }
        },
        {
            key: "findTransactionByHash",
            value: function findTransactionByHash(txHash) {
                var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                try {
                    for(var _iterator = this.transactions.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                        var tx = _step.value;
                        if (tx.txHash === txHash) {
                            return tx;
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
                return null;
            }
        },
        {
            key: "onTxReorg",
            value: function onTxReorg(txHash, chainName) {
                return _async_to_generator(function() {
                    var tx;
                    return _ts_generator(this, function(_state) {
                        tx = this.findTransactionByHash(txHash);
                        if (!tx) {
                            this.logger.warn("[".concat(chainName, "] Cannot find transaction ").concat(txHash, " for reorg handling"));
                            return [
                                2,
                                null
                            ];
                        }
                        this.logger.info("[".concat(chainName, "] Handling reorg for transaction ").concat(txHash));
                        // Here you would implement the logic to resend the transaction
                        // This is a simplified version
                        tx.status = "failed";
                        // In a real implementation, you would need to extract the original tx params
                        // and call writeContract again
                        return [
                            2,
                            null
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "onTxFinality",
            value: function onTxFinality(txHash, chainName) {
                var tx = this.findTransactionByHash(txHash);
                if (!tx) {
                    this.logger.warn("[".concat(chainName, "] Cannot find transaction ").concat(txHash, " for finality handling"));
                    return;
                }
                this.logger.info("[".concat(chainName, "] Transaction ").concat(txHash, " is now final"));
                tx.status = "finalized";
            }
        },
        {
            key: "getPendingTransactions",
            value: function getPendingTransactions(chainName) {
                var allTxs = Array.from(this.transactions.values());
                return allTxs.filter(function(tx) {
                    if (chainName && tx.chainName !== chainName) return false;
                    return tx.status !== "finalized";
                });
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                this.transactions.clear();
                this.txByType.clear();
                this.logger.info("Disposed");
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance(networkManager, viemClientManager) {
                TxWriter.instance = new TxWriter(networkManager, viemClientManager);
                return TxWriter.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!TxWriter.instance) {
                    throw new Error("TxWriter is not initialized. Call createInstance() first.");
                }
                return TxWriter.instance;
            }
        }
    ]);
    return TxWriter;
}();
_define_property(TxWriter, "instance", void 0);
