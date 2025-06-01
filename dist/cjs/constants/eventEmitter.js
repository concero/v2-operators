"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "eventEmitter", {
    enumerable: true,
    get: function() {
        return eventEmitter;
    }
});
var _nodeevents = require("node:events");
var eventEmitter = new _nodeevents.EventEmitter();
