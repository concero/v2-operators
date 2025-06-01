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
import { BlockCheckpointManager, BlockManagerRegistry, DeploymentManager, NetworkManager, NonceManager, RpcManager, TxManager, TxMonitor, TxReader, TxWriter, ViemClientManager } from "../managers";
import { HttpClient } from "./httpClient";
import { Logger } from "./logger";
/** Initialize all managers in the correct dependency order */ export function initializeManagers() {
    return _async_to_generator(function() {
        var logger, httpClient, httpQueue, rpcManager, viemClientManager, deploymentManager, networkManager, blockCheckpointManager, blockManagerRegistry, txWriter, txReader, txMonitor, txManager, nonceManager;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    logger = Logger.createInstance();
                    return [
                        4,
                        logger.initialize()
                    ];
                case 1:
                    _state.sent();
                    httpClient = HttpClient.getInstance();
                    httpQueue = HttpClient.getQueueInstance();
                    httpClient.initialize();
                    httpQueue.initialize();
                    // Core infrastructure managers
                    rpcManager = RpcManager.createInstance();
                    viemClientManager = ViemClientManager.createInstance(rpcManager);
                    deploymentManager = DeploymentManager.createInstance();
                    networkManager = NetworkManager.createInstance(rpcManager, deploymentManager);
                    blockCheckpointManager = BlockCheckpointManager.createInstance();
                    blockManagerRegistry = BlockManagerRegistry.createInstance(blockCheckpointManager, networkManager, viemClientManager, rpcManager);
                    return [
                        4,
                        rpcManager.initialize()
                    ];
                case 2:
                    _state.sent();
                    return [
                        4,
                        viemClientManager.initialize()
                    ];
                case 3:
                    _state.sent();
                    return [
                        4,
                        deploymentManager.initialize()
                    ];
                case 4:
                    _state.sent();
                    return [
                        4,
                        networkManager.initialize()
                    ];
                case 5:
                    _state.sent();
                    return [
                        4,
                        blockCheckpointManager.initialize()
                    ];
                case 6:
                    _state.sent();
                    return [
                        4,
                        blockManagerRegistry.initialize()
                    ];
                case 7:
                    _state.sent();
                    txWriter = TxWriter.createInstance(networkManager, viemClientManager);
                    txReader = TxReader.createInstance(networkManager, viemClientManager, blockManagerRegistry);
                    return [
                        4,
                        txWriter.initialize()
                    ];
                case 8:
                    _state.sent();
                    return [
                        4,
                        txReader.initialize()
                    ];
                case 9:
                    _state.sent();
                    txMonitor = TxMonitor.createInstance(viemClientManager, function(txHash, chainName) {
                        return txWriter.onTxFinality(txHash, chainName);
                    }, function(txHash, chainName) {
                        return txWriter.onTxReorg(txHash, chainName);
                    });
                    txManager = TxManager.createInstance(networkManager, viemClientManager, blockManagerRegistry, txWriter, txReader, txMonitor);
                    return [
                        4,
                        txManager.initialize()
                    ];
                case 10:
                    _state.sent();
                    nonceManager = NonceManager.createInstance();
                    return [
                        4,
                        nonceManager.initialize()
                    ];
                case 11:
                    _state.sent();
                    return [
                        2
                    ];
            }
        });
    })();
}
