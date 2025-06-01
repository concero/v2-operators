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
import { getAbiItem } from "viem";
import { setupEventListener } from "../../common/eventListener/setupEventListener";
import { DeploymentManager, NetworkManager } from "../../common/managers";
import { Logger } from "../../common/utils";
import { globalConfig } from "../../constants";
import { requestCLFMessageReport } from "../businessLogic/requestCLFMessageReport";
import { submitCLFMessageReport } from "../businessLogic/submitCLFMessageReport";
/**
 * Sets up event listeners for all active networks and the verifier network.
 * Uses the TxManager's new log watcher system to track specific events:
 * - ConceroMessageSent and ConceroMessageReceived on all ConceroRouters
 * - MessageReportRequested and MessageReport on the ConceroVerifier
 */ export function setupEventListeners() {
    return _async_to_generator(function() {
        var logger, networkManager, deploymentManager, activeNetworks, eventListenerHandles, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, network, routerAddress, sentEvent, sentHandle, error, err, verifierNetwork, verifierAddress, messageReportEvent, messageReportHandle, error1;
        return _ts_generator(this, function(_state) {
            switch(_state.label){
                case 0:
                    logger = Logger.getInstance().getLogger("setupEventListeners");
                    networkManager = NetworkManager.getInstance();
                    deploymentManager = DeploymentManager.getInstance();
                    activeNetworks = networkManager.getActiveNetworks();
                    eventListenerHandles = [];
                    _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
                    _state.label = 1;
                case 1:
                    _state.trys.push([
                        1,
                        9,
                        10,
                        11
                    ]);
                    _iterator = activeNetworks[Symbol.iterator]();
                    _state.label = 2;
                case 2:
                    if (!!(_iteratorNormalCompletion = (_step = _iterator.next()).done)) return [
                        3,
                        8
                    ];
                    network = _step.value;
                    return [
                        4,
                        deploymentManager.getRouterByChainName(network.name)
                    ];
                case 3:
                    routerAddress = _state.sent();
                    _state.label = 4;
                case 4:
                    _state.trys.push([
                        4,
                        6,
                        ,
                        7
                    ]);
                    // Create event watchers for ConceroMessageSent event
                    sentEvent = getAbiItem({
                        abi: globalConfig.ABI.CONCERO_ROUTER,
                        name: "ConceroMessageSent"
                    });
                    return [
                        4,
                        setupEventListener(network, routerAddress, requestCLFMessageReport, sentEvent)
                    ];
                case 5:
                    sentHandle = _state.sent();
                    eventListenerHandles.push(sentHandle);
                    return [
                        3,
                        7
                    ];
                case 6:
                    error = _state.sent();
                    logger.error("Failed to set up router event listeners for ".concat(network.name, ":"), error);
                    return [
                        3,
                        7
                    ];
                case 7:
                    _iteratorNormalCompletion = true;
                    return [
                        3,
                        2
                    ];
                case 8:
                    return [
                        3,
                        11
                    ];
                case 9:
                    err = _state.sent();
                    _didIteratorError = true;
                    _iteratorError = err;
                    return [
                        3,
                        11
                    ];
                case 10:
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
                case 11:
                    // Set up Verifier event listeners
                    verifierNetwork = networkManager.getVerifierNetwork();
                    return [
                        4,
                        deploymentManager.getConceroVerifier()
                    ];
                case 12:
                    verifierAddress = _state.sent();
                    _state.label = 13;
                case 13:
                    _state.trys.push([
                        13,
                        15,
                        ,
                        16
                    ]);
                    // Create event watcher for MessageReportRequested event
                    // const reportRequestedEvent = getAbiItem({
                    //     abi: globalConfig.ABI.CONCERO_VERIFIER,
                    //     name: "MessageReportRequested",
                    // });
                    // const reportRequestedHandle = await setupEventListener(
                    //     verifierNetwork,
                    //     verifierAddress,
                    //     onVerifierMessageReportRequestedLogs,
                    //     reportRequestedEvent as AbiEvent,
                    // );
                    // eventListenerHandles.push(reportRequestedHandle);
                    // logger.info('[setupEventListeners] Created MessageReportRequested watcher for verifier');
                    // Create event watcher for MessageReport event
                    messageReportEvent = getAbiItem({
                        abi: globalConfig.ABI.CONCERO_VERIFIER,
                        name: "MessageReport"
                    });
                    return [
                        4,
                        setupEventListener(verifierNetwork, verifierAddress, submitCLFMessageReport, messageReportEvent)
                    ];
                case 14:
                    messageReportHandle = _state.sent();
                    eventListenerHandles.push(messageReportHandle);
                    return [
                        3,
                        16
                    ];
                case 15:
                    error1 = _state.sent();
                    logger.error("Failed to set up verifier event listeners:", error1);
                    return [
                        3,
                        16
                    ];
                case 16:
                    return [
                        2
                    ];
            }
        });
    })();
}
