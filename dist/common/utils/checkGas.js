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
import { formatUnits } from "viem";
import { WebClient } from "@slack/web-api";
import { globalConfig } from "../../constants";
import { NetworkManager, ViemClientManager } from "../managers";
import { Logger } from "./logger";
var SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE = 15n;
function notifyInSlack(message) {
    return _async_to_generator(function() {
        var webClient, res, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    _state.trys.push([
                        0,
                        2,
                        ,
                        3
                    ]);
                    if (!globalConfig.NOTIFICATIONS.SLACK.MONITORING_SYSTEM_CHANNEL_ID || !globalConfig.NOTIFICATIONS.SLACK.BOT_TOKEN) {
                        return [
                            2
                        ];
                    }
                    webClient = new WebClient(globalConfig.NOTIFICATIONS.SLACK.BOT_TOKEN);
                    return [
                        4,
                        webClient.chat.postMessage({
                            channel: globalConfig.NOTIFICATIONS.SLACK.MONITORING_SYSTEM_CHANNEL_ID,
                            text: message
                        })
                    ];
                case 1:
                    res = _state.sent();
                    if (!res.ok) {
                        console.error("Failed to send message to slack: ".concat(res.error));
                    }
                    return [
                        3,
                        3
                    ];
                case 2:
                    error = _state.sent();
                    console.error(JSON.stringify(error, null, 2));
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
export function getChainOperatorMinBalance(publicClient) {
    return _async_to_generator(function() {
        var currentGasPrice, averageTxCostInWei;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        publicClient.getGasPrice()
                    ];
                case 1:
                    currentGasPrice = _state.sent();
                    averageTxCostInWei = currentGasPrice * globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT;
                    return [
                        2,
                        averageTxCostInWei * SAFE_TXS_COUNT_FOR_OPERATOR_BALANCE
                    ];
            }
        });
    })();
}
function checkAndNotifyInsufficientGas() {
    return _async_to_generator(function() {
        var operatorAddress, viemClientManager, networkManager, logger, activeNetworks, balancePromises, chainsInfo, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, chainInfo, balance, operatorMinBalance, network, message, err, error;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    operatorAddress = globalConfig.OPERATOR_ADDRESS;
                    viemClientManager = ViemClientManager.getInstance();
                    networkManager = NetworkManager.getInstance();
                    logger = Logger.getInstance().getLogger("GasChecker");
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        11,
                        ,
                        12
                    ]);
                    activeNetworks = networkManager.getActiveNetworks();
                    if (activeNetworks.length === 0) {
                        logger.warn("No active networks found when checking gas balances");
                        return [
                            2
                        ];
                    }
                    balancePromises = activeNetworks.map(function(network) {
                        return _async_to_generator(function() {
                            var publicClient, _ref, balance, operatorMinBalance;
                            return _ts_generator(this, function(_state) {
                                switch(_state.label){
                                    case 0:
                                        publicClient = viemClientManager.getClients(network).publicClient;
                                        return [
                                            4,
                                            Promise.all([
                                                publicClient.getBalance({
                                                    address: operatorAddress
                                                }),
                                                getChainOperatorMinBalance(publicClient)
                                            ])
                                        ];
                                    case 1:
                                        _ref = _sliced_to_array.apply(void 0, [
                                            _state.sent(),
                                            2
                                        ]), balance = _ref[0], operatorMinBalance = _ref[1];
                                        return [
                                            2,
                                            {
                                                network: network,
                                                balance: balance,
                                                operatorMinBalance: operatorMinBalance
                                            }
                                        ];
                                }
                            });
                        })();
                    });
                    return [
                        4,
                        Promise.all(balancePromises)
                    ];
                case 2:
                    chainsInfo = _state.sent();
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    _state.label = 3;
                case 3:
                    _state.trys.push([
                        3,
                        8,
                        9,
                        10
                    ]);
                    _iterator = chainsInfo[Symbol.iterator]();
                    _state.label = 4;
                case 4:
                    if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                        3,
                        7
                    ];
                    chainInfo = _step.value;
                    balance = chainInfo.balance, operatorMinBalance = chainInfo.operatorMinBalance, network = chainInfo.network;
                    if (!(balance < operatorMinBalance)) return [
                        3,
                        6
                    ];
                    message = "Insufficient gas on ".concat(network.name, " (chain ID: ").concat(network.id, "). Minimum required: ").concat(formatUnits(operatorMinBalance, 18), ", actual: ").concat(formatUnits(balance, 18));
                    return [
                        4,
                        notifyInSlack(message)
                    ];
                case 5:
                    _state.sent();
                    logger.info(message);
                    _state.label = 6;
                case 6:
                    _iteratorNormalCompletion = true;
                    return [
                        3,
                        4
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
                        3,
                        12
                    ];
                case 11:
                    error = _state.sent();
                    logger.error("Error checking gas balances:", error);
                    throw error;
                case 12:
                    return [
                        2
                    ];
            }
        });
    })();
}
export function checkGas() {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        checkAndNotifyInsufficientGas()
                    ];
                case 1:
                    _state.sent();
                    setInterval(function() {
                        return _async_to_generator(function() {
                            return _ts_generator(this, function(_state) {
                                switch(_state.label){
                                    case 0:
                                        return [
                                            4,
                                            checkAndNotifyInsufficientGas()
                                        ];
                                    case 1:
                                        _state.sent();
                                        return [
                                            2
                                        ];
                                }
                            });
                        })();
                    }, globalConfig.NOTIFICATIONS.INTERVAL);
                    return [
                        2
                    ];
            }
        });
    })();
}
