"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get getRpcExtension () {
        return getRpcExtension;
    },
    get getRpcOverride () {
        return getRpcOverride;
    }
});
function getRpcOverride() {
    try {
        return require("../../rpcs.override.json");
    } catch (e) {
        return {};
    }
}
function getRpcExtension() {
    try {
        return require("../../rpcs.extension.json");
    } catch (e) {
        return {};
    }
}
