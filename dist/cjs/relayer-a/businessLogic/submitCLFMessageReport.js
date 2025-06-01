"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "submitCLFMessageReport", {
    enumerable: true,
    get: function() {
        return submitCLFMessageReport;
    }
});
var _viem = require("viem");
var _decodeLogs = require("../../common/eventListener/decodeLogs");
var _managers = require("../../common/managers");
var _utils = require("../../common/utils");
var _ = require("../../common/utils/");
var _constants = require("../../constants");
function _array_like_to_array(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for(var i = 0, arr2 = new Array(len); i < len; i++)arr2[i] = arr[i];
    return arr2;
}
function _array_with_holes(arr) {
    if (Array.isArray(arr)) return arr;
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
function _sliced_to_array(arr, i) {
    return _array_with_holes(arr) || _iterable_to_array_limit(arr, i) || _unsupported_iterable_to_array(arr, i) || _non_iterable_rest();
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
function parseMessageResults(decodedCLFReport, logger) {
    return _async_to_generator(function() {
        var messageResults, i, decodedResult;
        return _ts_generator(this, function(_state) {
            messageResults = [];
            for(i = 0; i < decodedCLFReport.report.results.length; i++){
                try {
                    decodedResult = (0, _utils.decodeMessageReportResult)(decodedCLFReport.report.results[i]);
                    messageResults.push(decodedResult);
                    logger.debug("Successfully decoded result ".concat(i, ": messageId ").concat(decodedResult.messageId));
                } catch (error) {
                    logger.error("Failed to decode result ".concat(i, ": ").concat(error));
                }
            }
            return [
                2,
                messageResults
            ];
        });
    })();
}
function groupMessagesByDestination(messageResults) {
    var messagesByDstChain = new Map();
    messageResults.forEach(function(result, index) {
        var dstChainSelector = result.dstChainSelector.toString();
        if (!messagesByDstChain.has(dstChainSelector)) {
            messagesByDstChain.set(dstChainSelector, {
                results: [],
                indexes: []
            });
        }
        messagesByDstChain.get(dstChainSelector).results.push(result);
        messagesByDstChain.get(dstChainSelector).indexes.push(index);
    });
    return messagesByDstChain;
}
function fetchOriginalMessage(result, activeNetworkNames, networkManager, deploymentManager, blockManagerRegistry, txManager, logger) {
    return _async_to_generator(function() {
        var srcChainSelector, messageId, srcChain, srcContractAddress, srcBlockManager, currentBlock, decodedLogs, conceroMessageSentLog, _conceroMessageSentLog_args, message, dstChainData, decodedDstChainData;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    srcChainSelector = result.srcChainSelector, messageId = result.messageId;
                    srcChain = networkManager.getNetworkBySelector(srcChainSelector.toString());
                    if (!activeNetworkNames.includes(srcChain.name)) {
                        logger.warn("".concat(srcChain.name, " is not active. Skipping message with id ").concat(messageId));
                        return [
                            2,
                            {
                                message: null,
                                gasLimit: BigInt(0)
                            }
                        ];
                    }
                    return [
                        4,
                        deploymentManager.getRouterByChainName(srcChain.name)
                    ];
                case 1:
                    srcContractAddress = _state.sent();
                    srcBlockManager = blockManagerRegistry.getBlockManager(srcChain.name);
                    return [
                        4,
                        srcBlockManager.getLatestBlock()
                    ];
                case 2:
                    currentBlock = _state.sent();
                    return [
                        4,
                        txManager.getLogs({
                            address: srcContractAddress,
                            event: (0, _viem.getAbiItem)({
                                abi: _constants.globalConfig.ABI.CONCERO_ROUTER,
                                name: "ConceroMessageSent"
                            }),
                            args: {
                                messageId: messageId
                            },
                            fromBlock: currentBlock - BigInt(300),
                            toBlock: currentBlock
                        }, srcChain)
                    ];
                case 3:
                    decodedLogs = _state.sent();
                    if (decodedLogs.length === 0) {
                        logger.warn("".concat(srcChain.name, ": No decodedLogs found for messageId ").concat(messageId, " in the last 300 blocks."));
                        return [
                            2,
                            {
                                message: null,
                                gasLimit: BigInt(0)
                            }
                        ];
                    }
                    // Find the ConceroMessageSent event
                    conceroMessageSentLog = decodedLogs.find(function(log) {
                        var _log_args_messageId, _log_args;
                        return log.eventName === "ConceroMessageSent" && ((_log_args = log.args) === null || _log_args === void 0 ? void 0 : (_log_args_messageId = _log_args.messageId) === null || _log_args_messageId === void 0 ? void 0 : _log_args_messageId.toLowerCase()) === messageId.toLowerCase();
                    });
                    if (!conceroMessageSentLog) {
                        logger.error("Could not find ConceroMessageSent event with messageId ".concat(messageId));
                        return [
                            2,
                            {
                                message: null,
                                gasLimit: BigInt(0)
                            }
                        ];
                    }
                    _conceroMessageSentLog_args = conceroMessageSentLog.args, message = _conceroMessageSentLog_args.message, dstChainData = _conceroMessageSentLog_args.dstChainData;
                    // Add up gas limits for all messages to ensure enough gas for the batch
                    decodedDstChainData = (0, _viem.decodeAbiParameters)([
                        _constants.globalConfig.ABI.EVM_DST_CHAIN_DATA
                    ], dstChainData)[0];
                    return [
                        2,
                        {
                            message: message,
                            gasLimit: decodedDstChainData.gasLimit
                        }
                    ];
            }
        });
    })();
}
function submitBatchToDestination(dstChain, reportSubmission, messages, indexes, results, totalGasLimit, viemClientManager, deploymentManager, txManager, logger) {
    return _async_to_generator(function() {
        var dstConceroRouter, _viemClientManager_getClients, walletClient, publicClient, managedTx, messageIds;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    if (_constants.globalConfig.TX_MANAGER.DRY_RUN) {
                        logger.info("[".concat(dstChain.name, "] Dry run: CLF message report with ").concat(messages.length, " messages would be submitted"));
                        return [
                            2
                        ];
                    }
                    return [
                        4,
                        deploymentManager.getRouterByChainName(dstChain.name)
                    ];
                case 1:
                    dstConceroRouter = _state.sent();
                    _viemClientManager_getClients = viemClientManager.getClients(dstChain), walletClient = _viemClientManager_getClients.walletClient, publicClient = _viemClientManager_getClients.publicClient;
                    return [
                        4,
                        txManager.callContract(walletClient, publicClient, dstChain, {
                            address: dstConceroRouter,
                            abi: _constants.globalConfig.ABI.CONCERO_ROUTER,
                            functionName: "submitMessageReport",
                            args: [
                                reportSubmission,
                                messages,
                                indexes.map(function(index) {
                                    return BigInt(index);
                                })
                            ],
                            chain: dstChain.viemChain,
                            gas: totalGasLimit + BigInt(messages.length) * _constants.globalConfig.TX_MANAGER.GAS_LIMIT.SUBMIT_MESSAGE_REPORT_OVERHEAD
                        })
                    ];
                case 2:
                    managedTx = _state.sent();
                    messageIds = results.map(function(result) {
                        return result.messageId;
                    }).join(", ");
                    if (managedTx && managedTx.txHash) {
                        logger.info("[".concat(dstChain.name, "] CLF Report with ").concat(messages.length, " results submitted with hash: ").concat(managedTx.txHash));
                        logger.debug("[".concat(dstChain.name, "] Message IDs in batch: ").concat(messageIds));
                    } else {
                        logger.error("[".concat(dstChain.name, "] Failed to submit batch of CLF message reports. Message IDs: ").concat(messageIds));
                    }
                    return [
                        2
                    ];
            }
        });
    })();
}
function submitCLFMessageReport(logs, network) {
    return _async_to_generator(function() {
        var logger, decodedLogs, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    if (logs.length === 0) return [
                        2
                    ];
                    logger = _.Logger.getInstance().getLogger("processMessageReports");
                    logger.debug("Processing ".concat(logs.length, " MessageReport logs"));
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        3,
                        ,
                        4
                    ]);
                    // Decode the logs
                    decodedLogs = (0, _decodeLogs.decodeLogs)(logs, _constants.globalConfig.ABI.CONCERO_VERIFIER);
                    return [
                        4,
                        processMessageReports(decodedLogs)
                    ];
                case 2:
                    _state.sent();
                    return [
                        3,
                        4
                    ];
                case 3:
                    error = _state.sent();
                    logger.error("Error processing message report logs: ".concat(error));
                    return [
                        3,
                        4
                    ];
                case 4:
                    return [
                        2
                    ];
            }
        });
    })();
}
/**
 * Main function that processes decoded message report logs
 */ function processMessageReports(logs) {
    return _async_to_generator(function() {
        var logger, networkManager, blockManagerRegistry, viemClientManager, deploymentManager, txManager, activeNetworks, activeNetworkNames, txHashToLogs, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, log, txHash, existingLogs, txProcessPromises, e;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    logger = _.Logger.getInstance().getLogger("submitCLFMessageReport");
                    networkManager = _managers.NetworkManager.getInstance();
                    blockManagerRegistry = _managers.BlockManagerRegistry.getInstance();
                    viemClientManager = _managers.ViemClientManager.getInstance();
                    deploymentManager = _managers.DeploymentManager.getInstance();
                    txManager = _managers.TxManager.getInstance();
                    activeNetworks = networkManager.getActiveNetworks();
                    activeNetworkNames = activeNetworks.map(function(network) {
                        return network.name;
                    });
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        3,
                        ,
                        4
                    ]);
                    // Group logs by transaction hash
                    txHashToLogs = new Map();
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    try {
                        for(_iterator = logs[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                            log = _step.value;
                            txHash = log.transactionHash;
                            existingLogs = txHashToLogs.get(txHash) || [];
                            existingLogs.push(log);
                            txHashToLogs.set(txHash, existingLogs);
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
                    // Process transactions in parallel
                    txProcessPromises = Array.from(txHashToLogs.entries()).map(function(param) {
                        var _param = _sliced_to_array(param, 2), txHash = _param[0], txLogs = _param[1];
                        return _async_to_generator(function() {
                            var verifierNetwork, _viemClientManager_getClients, verifierPublicClient, messageReportTx, decodedCLFReport, messageResults, messagesByDstChain, reportSubmission, dstChainProcessPromises, error;
                            return _ts_generator(this, function(_state) {
                                switch(_state.label){
                                    case 0:
                                        logger.debug("Processing transaction ".concat(txHash, " with ").concat(txLogs.length, " logs"));
                                        _state.label = 1;
                                    case 1:
                                        _state.trys.push([
                                            1,
                                            5,
                                            ,
                                            6
                                        ]);
                                        // 1. Fetch and decode the CLF report
                                        verifierNetwork = networkManager.getVerifierNetwork();
                                        _viemClientManager_getClients = viemClientManager.getClients(verifierNetwork), verifierPublicClient = _viemClientManager_getClients.publicClient;
                                        return [
                                            4,
                                            verifierPublicClient.getTransaction({
                                                hash: txHash
                                            })
                                        ];
                                    case 2:
                                        messageReportTx = _state.sent();
                                        decodedCLFReport = (0, _utils.decodeCLFReport)(messageReportTx);
                                        logger.debug("Report contains ".concat(decodedCLFReport.report.results.length, " results"));
                                        return [
                                            4,
                                            parseMessageResults(decodedCLFReport, logger)
                                        ];
                                    case 3:
                                        messageResults = _state.sent();
                                        if (messageResults.length === 0) {
                                            logger.warn("No valid message results found in the report for transaction ".concat(txHash));
                                            return [
                                                2
                                            ];
                                        }
                                        // 3. Group messages by destination chain
                                        messagesByDstChain = groupMessagesByDestination(messageResults);
                                        // 4. Create the report submission object
                                        reportSubmission = {
                                            context: decodedCLFReport.reportContext,
                                            report: decodedCLFReport.reportBytes,
                                            rs: decodedCLFReport.rs,
                                            ss: decodedCLFReport.ss,
                                            rawVs: decodedCLFReport.rawVs
                                        };
                                        // 5. Process each destination chain in parallel
                                        dstChainProcessPromises = Array.from(messagesByDstChain.entries()).map(function(param) {
                                            var _param = _sliced_to_array(param, 2), dstChainSelector = _param[0], _param_ = _param[1], results = _param_.results, indexes = _param_.indexes;
                                            return _async_to_generator(function() {
                                                var dstChain, dstBlockManager, messagePromises, resolvedMessages, messages, totalGasLimit, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _step_value, message, gasLimit;
                                                return _ts_generator(this, function(_state) {
                                                    switch(_state.label){
                                                        case 0:
                                                            dstChain = networkManager.getNetworkBySelector(dstChainSelector);
                                                            if (!activeNetworkNames.includes(dstChain.name)) {
                                                                logger.warn("".concat(dstChain.name, " is not active. Skipping message submission."));
                                                                return [
                                                                    2
                                                                ];
                                                            }
                                                            dstBlockManager = blockManagerRegistry.getBlockManager(dstChain.name);
                                                            if (!dstBlockManager) {
                                                                logger.error("No BlockManager for ".concat(dstChain.name));
                                                                return [
                                                                    2
                                                                ];
                                                            }
                                                            // 6. Fetch original messages from source chains in parallel
                                                            messagePromises = results.map(function(result) {
                                                                return fetchOriginalMessage(result, activeNetworkNames, networkManager, deploymentManager, blockManagerRegistry, txManager, logger);
                                                            });
                                                            return [
                                                                4,
                                                                Promise.all(messagePromises)
                                                            ];
                                                        case 1:
                                                            resolvedMessages = _state.sent();
                                                            messages = [];
                                                            totalGasLimit = BigInt(0);
                                                            _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                                                            try {
                                                                for(_iterator = resolvedMessages[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                                                    _step_value = _step.value, message = _step_value.message, gasLimit = _step_value.gasLimit;
                                                                    if (message) {
                                                                        messages.push(message);
                                                                        totalGasLimit += gasLimit;
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
                                                            if (messages.length !== results.length) {
                                                                logger.error("[".concat(dstChain.name, "] Could only find ").concat(messages.length, "/").concat(results.length, " messages. Skipping batch submission."));
                                                                return [
                                                                    2
                                                                ];
                                                            }
                                                            // 7. Submit the batch to destination chain
                                                            return [
                                                                4,
                                                                submitBatchToDestination(dstChain, reportSubmission, messages, indexes, results, totalGasLimit, viemClientManager, deploymentManager, txManager, logger)
                                                            ];
                                                        case 2:
                                                            _state.sent();
                                                            return [
                                                                2
                                                            ];
                                                    }
                                                });
                                            })();
                                        });
                                        return [
                                            4,
                                            Promise.all(dstChainProcessPromises)
                                        ];
                                    case 4:
                                        _state.sent();
                                        return [
                                            3,
                                            6
                                        ];
                                    case 5:
                                        error = _state.sent();
                                        logger.error("Error processing transaction ".concat(txHash, ": ").concat(error));
                                        return [
                                            3,
                                            6
                                        ];
                                    case 6:
                                        return [
                                            2
                                        ];
                                }
                            });
                        })();
                    });
                    return [
                        4,
                        Promise.all(txProcessPromises)
                    ];
                case 2:
                    _state.sent();
                    return [
                        3,
                        4
                    ];
                case 3:
                    e = _state.sent();
                    logger.error("Error when submitting clf report: ".concat(e));
                    return [
                        3,
                        4
                    ];
                case 4:
                    return [
                        2
                    ];
            }
        });
    })();
}
