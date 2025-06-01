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
import { DeploymentManager, NetworkManager, ViemClientManager } from "../../common/managers";
import { callContract } from "../../common/utils";
import { Logger } from "../../common/utils/";
import { globalConfig } from "../../constants";
/**
 * @returns {bigint} The minimum deposit amount.
 * @notice Retrieves the minimum required deposit from the conceroVerifier contract.
 */ function getMinimumDeposit(publicClient, verifierAddress) {
    return _async_to_generator(function() {
        var depositAmount;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        publicClient.readContract({
                            address: verifierAddress,
                            abi: globalConfig.ABI.CONCERO_VERIFIER,
                            functionName: "getMinimumOperatorDeposit",
                            args: []
                        })
                    ];
                case 1:
                    depositAmount = _state.sent();
                    return [
                        2,
                        BigInt(depositAmount)
                    ];
            }
        });
    })();
}
/**
 * @returns {Promise<bigint>} The current operator deposit amount.
 * @notice Retrieves the current deposit amount for the operator.
 */ function getCurrentOperatorDeposit(publicClient, verifierAddress) {
    return _async_to_generator(function() {
        var currentDeposit;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        publicClient.readContract({
                            address: verifierAddress,
                            abi: globalConfig.ABI.CONCERO_VERIFIER,
                            functionName: "getOperatorDeposit",
                            args: [
                                globalConfig.OPERATOR_ADDRESS
                            ]
                        })
                    ];
                case 1:
                    currentDeposit = _state.sent();
                    return [
                        2,
                        BigInt(currentDeposit)
                    ];
            }
        });
    })();
}
function fetchDepositAndDepositIfNeeded() {
    return _async_to_generator(function() {
        var logger, networkManager, viemClientManager, deploymentManager, verifierNetwork, verifierAddress, _viemClientManager_getClients, publicClient, walletClient, account, requiredDeposit, currentDeposit, txHash;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    logger = Logger.getInstance().getLogger("ensureDeposit");
                    networkManager = NetworkManager.getInstance();
                    viemClientManager = ViemClientManager.getInstance();
                    deploymentManager = DeploymentManager.getInstance();
                    verifierNetwork = networkManager.getVerifierNetwork();
                    return [
                        4,
                        deploymentManager.getConceroVerifier()
                    ];
                case 1:
                    verifierAddress = _state.sent();
                    _viemClientManager_getClients = viemClientManager.getClients(verifierNetwork), publicClient = _viemClientManager_getClients.publicClient, walletClient = _viemClientManager_getClients.walletClient, account = _viemClientManager_getClients.account;
                    return [
                        4,
                        getMinimumDeposit(publicClient, verifierAddress)
                    ];
                case 2:
                    requiredDeposit = _state.sent() * 200n;
                    return [
                        4,
                        getCurrentOperatorDeposit(publicClient, verifierAddress)
                    ];
                case 3:
                    currentDeposit = _state.sent();
                    if (currentDeposit >= requiredDeposit) {
                        logger.info("Sufficient deposit of ".concat(currentDeposit, " already exists"));
                        return [
                            2,
                            undefined
                        ];
                    }
                    return [
                        4,
                        callContract(publicClient, walletClient, {
                            chain: verifierNetwork.viemChain,
                            address: verifierAddress,
                            abi: globalConfig.ABI.CONCERO_VERIFIER,
                            functionName: "operatorDeposit",
                            args: [
                                globalConfig.OPERATOR_ADDRESS
                            ],
                            value: requiredDeposit,
                            account: account
                        })
                    ];
                case 4:
                    txHash = _state.sent();
                    logger.info("Deposited ".concat(requiredDeposit, " to ConceroVerifier with hash ").concat(txHash));
                    return [
                        2
                    ];
            }
        });
    })();
}
/**
 * @returns {Promise<Hash | undefined>} Transaction hash if deposit was made, undefined if no
 *   deposit was needed.
 * @notice Makes an operator deposit if the current deposit is insufficient.
 */ export function ensureDeposit() {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    return [
                        4,
                        fetchDepositAndDepositIfNeeded()
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
                                            fetchDepositAndDepositIfNeeded()
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
