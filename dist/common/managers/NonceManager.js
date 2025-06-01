function _assert_this_initialized(self) {
    if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
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
function _call_super(_this, derived, args) {
    derived = _get_prototype_of(derived);
    return _possible_constructor_return(_this, _is_native_reflect_construct() ? Reflect.construct(derived, args || [], _get_prototype_of(_this).constructor) : derived.apply(_this, args));
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
function _get_prototype_of(o) {
    _get_prototype_of = Object.setPrototypeOf ? Object.getPrototypeOf : function getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _get_prototype_of(o);
}
function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
            value: subClass,
            writable: true,
            configurable: true
        }
    });
    if (superClass) _set_prototype_of(subClass, superClass);
}
function _possible_constructor_return(self, call) {
    if (call && (_type_of(call) === "object" || typeof call === "function")) {
        return call;
    }
    return _assert_this_initialized(self);
}
function _set_prototype_of(o, p) {
    _set_prototype_of = Object.setPrototypeOf || function setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
    };
    return _set_prototype_of(o, p);
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
function _is_native_reflect_construct() {
    try {
        var result = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function() {}));
    } catch (_) {}
    return (_is_native_reflect_construct = function() {
        return !!result;
    })();
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
import { Mutex } from "async-mutex";
import { createPublicClient } from "viem";
import { ManagerBase } from "./ManagerBase";
export var NonceManager = /*#__PURE__*/ function(ManagerBase) {
    "use strict";
    _inherits(NonceManager, ManagerBase);
    function NonceManager() {
        _class_call_check(this, NonceManager);
        var _this;
        _this = _call_super(this, NonceManager), _define_property(_this, "noncesMap", {}), _define_property(_this, "mutexMap", {});
        return _this;
    }
    _create_class(NonceManager, [
        {
            key: "get",
            value: function get(params) {
                return _async_to_generator(function() {
                    var _this, m;
                    return _ts_generator(this, function(_state) {
                        _this = this;
                        m = this.getMutex(params.chainId);
                        return [
                            2,
                            m.runExclusive(function() {
                                return _async_to_generator(function() {
                                    var actualNonce;
                                    return _ts_generator(this, function(_state) {
                                        switch(_state.label){
                                            case 0:
                                                if (!!this.noncesMap[params.chainId]) return [
                                                    3,
                                                    2
                                                ];
                                                return [
                                                    4,
                                                    this.fetchNonce(params)
                                                ];
                                            case 1:
                                                actualNonce = _state.sent();
                                                this.set(params, actualNonce);
                                                return [
                                                    2,
                                                    actualNonce
                                                ];
                                            case 2:
                                                return [
                                                    2,
                                                    this.noncesMap[params.chainId]
                                                ];
                                        }
                                    });
                                }).call(_this);
                            })
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "consume",
            value: function consume(params) {
                return _async_to_generator(function() {
                    var _this, m;
                    return _ts_generator(this, function(_state) {
                        _this = this;
                        m = this.getMutex(params.chainId);
                        return [
                            2,
                            m.runExclusive(function() {
                                return _async_to_generator(function() {
                                    var incrementedNonce, _tmp;
                                    return _ts_generator(this, function(_state) {
                                        switch(_state.label){
                                            case 0:
                                                if (!this.noncesMap[params.chainId]) return [
                                                    3,
                                                    1
                                                ];
                                                _tmp = this.noncesMap[params.chainId];
                                                return [
                                                    3,
                                                    3
                                                ];
                                            case 1:
                                                return [
                                                    4,
                                                    this.fetchNonce(params)
                                                ];
                                            case 2:
                                                _tmp = _state.sent();
                                                _state.label = 3;
                                            case 3:
                                                incrementedNonce = _tmp + 1;
                                                this.set(params, incrementedNonce);
                                                return [
                                                    2,
                                                    incrementedNonce
                                                ];
                                        }
                                    });
                                }).call(_this);
                            })
                        ];
                    });
                }).call(this);
            }
        },
        {
            key: "reset",
            value: function reset(params) {
                this.set(params, 0);
            }
        },
        {
            key: "set",
            value: function set(params, nonce) {
                this.noncesMap[params.chainId] = nonce;
            }
        },
        {
            key: "fetchNonce",
            value: function fetchNonce(params) {
                return _async_to_generator(function() {
                    var publicClient;
                    return _ts_generator(this, function(_state) {
                        switch(_state.label){
                            case 0:
                                publicClient = this.createPublicCLientFromGetNonceParams(params);
                                return [
                                    4,
                                    publicClient.getTransactionCount({
                                        address: params.address
                                    })
                                ];
                            case 1:
                                return [
                                    2,
                                    _state.sent()
                                ];
                        }
                    });
                }).call(this);
            }
        },
        {
            key: "getMutex",
            value: function getMutex(chainId) {
                if (!this.mutexMap[chainId]) {
                    this.mutexMap[chainId] = new Mutex();
                }
                return this.mutexMap[chainId];
            }
        },
        {
            key: "createPublicCLientFromGetNonceParams",
            value: function createPublicCLientFromGetNonceParams(params) {
                return createPublicClient({
                    transport: function() {
                        return params.client.transport;
                    },
                    chain: params.client.chain
                });
            }
        }
    ], [
        {
            key: "createInstance",
            value: function createInstance() {
                if (!NonceManager.instance) {
                    NonceManager.instance = new NonceManager();
                }
                return NonceManager.instance;
            }
        },
        {
            key: "getInstance",
            value: function getInstance() {
                if (!NonceManager.instance) {
                    throw new Error("NonceManager instance has not been created. Call createInstance() first.");
                }
                return NonceManager.instance;
            }
        },
        {
            key: "dispose",
            value: function dispose() {
                NonceManager.instance = null;
            }
        }
    ]);
    return NonceManager;
}(ManagerBase);
_define_property(NonceManager, "instance", null);
