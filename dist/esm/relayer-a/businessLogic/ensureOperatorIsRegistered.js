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
import { decodeEventLog } from "viem";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { DeploymentManager, NetworkManager, ViemClientManager } from "../../common/managers";
import { Logger, callContract } from "../../common/utils";
import { eventEmitter, globalConfig } from "../../constants";
var ChainType = {
    EVM: 0,
    NON_EVM: 1
};
var OperatorRegistrationAction = {
    Deregister: 0,
    Register: 1
};
/**
 * Checks if the operator is registered in the ConceroVerifier contract.
 *
 * @param publicClient - The public client to use for reading the contract.
 * @param networkManager - The network manager instance.
 * @param deploymentManager - The deployment manager instance.
 * @returns {Promise<boolean>} Whether the operator is registered.
 * @notice Checks if the operator is registered in the ConceroVerifier contract.
 */ function isOperatorRegistered(publicClient, networkManager, deploymentManager) {
    return _async_to_generator(function() {
        var conceroVerifierNetwork, isRegistered, _, _tmp;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    conceroVerifierNetwork = networkManager.getVerifierNetwork();
                    _ = publicClient.readContract;
                    _tmp = {
                        chain: conceroVerifierNetwork.viemChain
                    };
                    return [
                        4,
                        deploymentManager.getConceroVerifier()
                    ];
                case 1:
                    return [
                        4,
                        _.apply(publicClient, [
                            (_tmp.address = _state.sent(), _tmp.abi = globalConfig.ABI.CONCERO_VERIFIER, _tmp.functionName = "isOperatorRegistered", _tmp.args = [
                                globalConfig.OPERATOR_ADDRESS
                            ], _tmp)
                        ])
                    ];
                case 2:
                    isRegistered = _state.sent();
                    return [
                        2,
                        isRegistered
                    ];
            }
        });
    })();
}
/**
 * Requests operator registration from the ConceroVerifier contract.
 *
 * @param publicClient - The public client to use for reading the contract.
 * @param walletClient - The wallet client to use for writing to the contract.
 * @param account - The account to use for the transaction.
 * @param networkManager - The network manager instance.
 * @param deploymentManager - The deployment manager instance.
 * @returns {Promise<`0x${string}`>} The transaction hash of the registration request.
 */ function requestOperatorRegistration(publicClient, walletClient, account, networkManager, deploymentManager) {
    return _async_to_generator(function() {
        var conceroVerifierNetwork, chainTypes, operatorActions, operatorAddresses, transactionHash, _tmp, _tmp1;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    conceroVerifierNetwork = networkManager.getVerifierNetwork();
                    chainTypes = [
                        BigInt(ChainType.EVM)
                    ];
                    operatorActions = [
                        BigInt(OperatorRegistrationAction.Register)
                    ];
                    operatorAddresses = [
                        globalConfig.OPERATOR_ADDRESS
                    ];
                    _tmp = [
                        publicClient,
                        walletClient
                    ];
                    _tmp1 = {
                        chain: conceroVerifierNetwork.viemChain
                    };
                    return [
                        4,
                        deploymentManager.getConceroVerifier()
                    ];
                case 1:
                    return [
                        4,
                        callContract.apply(void 0, _tmp.concat([
                            (_tmp1.address = _state.sent(), _tmp1.abi = globalConfig.ABI.CONCERO_VERIFIER, _tmp1.functionName = "requestOperatorRegistration", _tmp1.args = [
                                chainTypes,
                                operatorActions,
                                operatorAddresses
                            ], _tmp1.account = account, _tmp1)
                        ]))
                    ];
                case 2:
                    transactionHash = _state.sent();
                    eventEmitter.emit("requestOperatorRegistration", {
                        txHash: transactionHash
                    });
                    return [
                        2,
                        transactionHash
                    ];
            }
        });
    })();
}
/**
 * Waits for the operator registration event on the ConceroVerifier contract.
 *
 * @param network - The network instance to monitor.
 * @param contractAddress - The address of the ConceroVerifier contract.
 * @param fromBlockNumber - The block number from which to start polling.
 * @param operatorAddress - The operator address to wait for registration.
 * @returns {Promise<Hash>} The transaction hash of the operator registration.
 */ export function waitForOperatorRegistration(network, contractAddress, fromBlockNumber, operatorAddress) {
    return _async_to_generator(function() {
        return _ts_generator(this, function(_state) {
            return [
                2,
                new Promise(function(resolve, reject) {
                    var listenerHandle;
                    var onLogs = function(logs) {
                        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                        try {
                            for(var _iterator = logs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                                var log = _step.value;
                                try {
                                    var decoded = decodeEventLog({
                                        abi: globalConfig.ABI.CONCERO_VERIFIER,
                                        eventName: "OperatorRegistered",
                                        data: log.data,
                                        topics: log.topics,
                                        strict: true
                                    });
                                    if (decoded && decoded.args && decoded.args.operator && decoded.args.operator.toLowerCase() === operatorAddress.toLowerCase() && BigInt(log.blockNumber) >= fromBlockNumber) {
                                        listenerHandle.stop();
                                        resolve(log.transactionHash);
                                        break;
                                    }
                                } catch (error) {}
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
                    };
                    setupEventListener(network, contractAddress, onLogs, globalConfig.BLOCK_MANAGER.POLLING_INTERVAL_MS).then(function(handle) {
                        listenerHandle = handle;
                    });
                })
            ];
        });
    })();
}
/**
 * Ensures that the operator is registered in the ConceroVerifier contract. If the operator is not
 * registered, it will request registration and wait for the registration to be confirmed.
 *
 * @returns {Promise<void>}
 */ export function ensureOperatorIsRegistered() {
    return _async_to_generator(function() {
        var logger, viemClientManager, networkManager, deploymentManager, verifierNetwork, _viemClientManager_getClients, publicClient, walletClient, account, registered, txHash, transaction, confirmedTxHash, _tmp;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    logger = Logger.getInstance().getLogger("ensureOperatorIsRegistered");
                    viemClientManager = ViemClientManager.getInstance();
                    networkManager = NetworkManager.getInstance();
                    deploymentManager = DeploymentManager.getInstance();
                    verifierNetwork = networkManager.getVerifierNetwork();
                    _viemClientManager_getClients = viemClientManager.getClients(verifierNetwork), publicClient = _viemClientManager_getClients.publicClient, walletClient = _viemClientManager_getClients.walletClient, account = _viemClientManager_getClients.account;
                    return [
                        4,
                        isOperatorRegistered(publicClient, networkManager, deploymentManager)
                    ];
                case 1:
                    registered = _state.sent();
                    if (registered) {
                        logger.info("Operator already registered");
                        return [
                            2
                        ];
                    }
                    return [
                        4,
                        requestOperatorRegistration(publicClient, walletClient, account, networkManager, deploymentManager)
                    ];
                case 2:
                    txHash = _state.sent();
                    logger.info("Requested operator registration with txHash ".concat(txHash));
                    return [
                        4,
                        publicClient.getTransaction({
                            hash: txHash
                        })
                    ];
                case 3:
                    transaction = _state.sent();
                    _tmp = [
                        verifierNetwork
                    ];
                    return [
                        4,
                        deploymentManager.getConceroVerifier()
                    ];
                case 4:
                    return [
                        4,
                        waitForOperatorRegistration.apply(void 0, _tmp.concat([
                            _state.sent(),
                            transaction.blockNumber,
                            globalConfig.OPERATOR_ADDRESS
                        ]))
                    ];
                case 5:
                    confirmedTxHash = _state.sent();
                    logger.info("Operator registration confirmed with txHash ".concat(confirmedTxHash));
                    eventEmitter.emit("operatorRegistered", {
                        txHash: confirmedTxHash
                    });
                    return [
                        2
                    ];
            }
        });
    })();
}
