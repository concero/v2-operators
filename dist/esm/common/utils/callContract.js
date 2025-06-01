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
function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
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
import { ContractFunctionExecutionError, NonceTooHighError, NonceTooLowError, TransactionExecutionError } from "viem";
import { AppErrorEnum, globalConfig } from "../../constants";
import { NonceManager } from "../managers";
import { AppError } from "./AppError";
import { asyncRetry } from "./asyncRetry";
function executeTransaction(publicClient, walletClient, params, nonceManager) {
    return _async_to_generator(function() {
        var chainId, address, txHash, request, nonce, paramsToSend;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    chainId = publicClient.chain.id;
                    address = walletClient.account.address;
                    if (!globalConfig.VIEM.SIMULATE_TX) return [
                        3,
                        3
                    ];
                    return [
                        4,
                        publicClient.simulateContract(params)
                    ];
                case 1:
                    request = _state.sent().request;
                    return [
                        4,
                        walletClient.writeContract({
                            request: request
                        })
                    ];
                case 2:
                    txHash = _state.sent();
                    return [
                        3,
                        6
                    ];
                case 3:
                    return [
                        4,
                        nonceManager.consume({
                            address: address,
                            chainId: chainId,
                            client: publicClient
                        })
                    ];
                case 4:
                    nonce = _state.sent();
                    paramsToSend = _object_spread_props(_object_spread({
                        gas: globalConfig.TX_MANAGER.GAS_LIMIT.DEFAULT
                    }, params), {
                        nonce: nonce
                    });
                    return [
                        4,
                        walletClient.writeContract(paramsToSend)
                    ];
                case 5:
                    txHash = _state.sent();
                    _state.label = 6;
                case 6:
                    return [
                        2,
                        txHash
                    ];
            }
        });
    })();
}
export function callContract(publicClient, walletClient, params) {
    return _async_to_generator(function() {
        var nonceManager, isRetryableError;
        return _ts_generator(this, function(_state) {
            try {
                nonceManager = NonceManager.getInstance();
                isRetryableError = function(error) {
                    return _async_to_generator(function() {
                        var chainId, address;
                        return _ts_generator(this, function(_state) {
                            if (_instanceof(error, ContractFunctionExecutionError)) {
                                if (_instanceof(error.cause, TransactionExecutionError)) {
                                    if (_instanceof(error.cause.cause, NonceTooHighError) || _instanceof(error.cause.cause, NonceTooLowError)) {
                                        chainId = publicClient.chain.id;
                                        address = walletClient.account.address;
                                        nonceManager.reset({
                                            chainId: chainId,
                                            address: address
                                        });
                                        return [
                                            2,
                                            true
                                        ];
                                    }
                                }
                            }
                            return [
                                2,
                                false
                            ];
                        });
                    })();
                };
                return [
                    2,
                    asyncRetry(function() {
                        return executeTransaction(publicClient, walletClient, params, nonceManager);
                    }, {
                        maxRetries: 100,
                        delayMs: 1000,
                        isRetryableError: isRetryableError
                    })
                ];
            } catch (error) {
                throw new AppError(AppErrorEnum.ContractCallError, error);
            }
            return [
                2
            ];
        });
    })();
}
