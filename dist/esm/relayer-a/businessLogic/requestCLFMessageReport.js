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
import { encodeAbiParameters, keccak256 } from "viem";
import { decodeLogs } from "../../common/eventListener/decodeLogs";
import { DeploymentManager, NetworkManager, TxManager, ViemClientManager } from "../../common/managers";
import { Logger } from "../../common/utils";
import { eventEmitter, globalConfig } from "../../constants";
export function requestCLFMessageReport(logs, network) {
    return _async_to_generator(function() {
        var logger, networkManager, verifierNetwork, verifierAddress, _ViemClientManager_getInstance_getClients, publicClient, walletClient, decodedLogs, promises, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, decodedLog, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    if (logs.length === 0) return [
                        2
                    ];
                    logger = Logger.getInstance().getLogger("requestCLFMessageReport");
                    logger.debug("Processing ".concat(logs.length, " logs for CLF message report requests from ").concat(network.name));
                    networkManager = NetworkManager.getInstance();
                    verifierNetwork = networkManager.getVerifierNetwork();
                    return [
                        4,
                        DeploymentManager.getInstance().getConceroVerifier()
                    ];
                case 1:
                    verifierAddress = _state.sent();
                    _ViemClientManager_getInstance_getClients = ViemClientManager.getInstance().getClients(verifierNetwork), publicClient = _ViemClientManager_getInstance_getClients.publicClient, walletClient = _ViemClientManager_getInstance_getClients.walletClient;
                    _state.label = 2;
                case 2:
                    _state.trys.push([
                        2,
                        4,
                        ,
                        5
                    ]);
                    decodedLogs = decodeLogs(logs, globalConfig.ABI.CONCERO_ROUTER);
                    promises = [];
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for(_iterator = decodedLogs[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            decodedLog = _step.value;
                            promises.push(processMessageReportRequest(decodedLog, network.chainSelector, logger, networkManager, verifierNetwork, verifierAddress, publicClient, walletClient));
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
                        4,
                        Promise.all(promises)
                    ];
                case 3:
                    _state.sent();
                    return [
                        3,
                        5
                    ];
                case 4:
                    error = _state.sent();
                    logger.error("Error processing logs from ".concat(network.name, ":"), error);
                    return [
                        3,
                        5
                    ];
                case 5:
                    return [
                        2
                    ];
            }
        });
    })();
}
function processMessageReportRequest(decodedLog, srcChainSelector, logger, networkManager, verifierNetwork, verifierAddress, publicClient, walletClient) {
    return _async_to_generator(function() {
        var _decodedLog_args, messageId, message, sender, encodedSrcChainData, dryRunTxHash, managedTx, error, _decodedLog_args1, _decodedLog_args2;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _state.trys.push([
                        0,
                        2,
                        ,
                        3
                    ]);
                    _decodedLog_args = decodedLog.args, messageId = _decodedLog_args.messageId, message = _decodedLog_args.message, sender = _decodedLog_args.sender;
                    if (!messageId || !message || !sender) {
                        logger.warn("Missing required data in log: ".concat(JSON.stringify(decodedLog)));
                        return [
                            2
                        ];
                    }
                    encodedSrcChainData = encodeAbiParameters([
                        {
                            type: "tuple",
                            components: [
                                {
                                    name: "blockNumber",
                                    type: "uint256"
                                },
                                {
                                    name: "sender",
                                    type: "address"
                                }
                            ]
                        }
                    ], [
                        {
                            blockNumber: decodedLog.blockNumber,
                            sender: sender
                        }
                    ]);
                    if (globalConfig.TX_MANAGER.DRY_RUN) {
                        dryRunTxHash = "dry-run-".concat(Date.now(), "-").concat(messageId);
                        logger.info("[DRY_RUN]:".concat(verifierNetwork.name, " CLF message report requested with hash: ").concat(dryRunTxHash));
                        eventEmitter.emit("requestMessageReport", {
                            txHash: dryRunTxHash
                        });
                        return [
                            2
                        ];
                    }
                    return [
                        4,
                        TxManager.getInstance().callContract(walletClient, publicClient, verifierNetwork, {
                            address: verifierAddress,
                            abi: globalConfig.ABI.CONCERO_VERIFIER,
                            functionName: "requestMessageReport",
                            args: [
                                messageId,
                                keccak256(message),
                                srcChainSelector,
                                encodedSrcChainData
                            ],
                            chain: verifierNetwork.viemChain,
                            options: {
                                receiptConfirmations: 3,
                                receiptTimeout: 60000
                            }
                        })
                    ];
                case 1:
                    managedTx = _state.sent();
                    if (managedTx && managedTx.txHash) {
                        eventEmitter.emit("requestMessageReport", {
                            txHash: managedTx.txHash
                        });
                        logger.info("".concat(verifierNetwork.name, " CLF message report requested with hash: ").concat(managedTx.txHash));
                    } else {
                        logger.error("".concat(verifierNetwork.name, " Failed to submit CLF message report request transaction"));
                    }
                    return [
                        3,
                        3
                    ];
                case 2:
                    error = _state.sent();
                    // TODO: move this error handling to global error handler!
                    logger.error("[".concat(verifierNetwork.name, "] Error requesting CLF message report for messageId ").concat(((_decodedLog_args1 = decodedLog.args) === null || _decodedLog_args1 === void 0 ? void 0 : _decodedLog_args1.messageId) || "unknown", ":"), error);
                    // Emit error event for monitoring
                    eventEmitter.emit("requestMessageReportError", {
                        messageId: (_decodedLog_args2 = decodedLog.args) === null || _decodedLog_args2 === void 0 ? void 0 : _decodedLog_args2.messageId,
                        error: error.message,
                        chainName: verifierNetwork.name
                    });
                    return [
                        3,
                        3
                    ];
                case 3:
                    return [
                        2
                    ];
            }
        });
    })();
}
