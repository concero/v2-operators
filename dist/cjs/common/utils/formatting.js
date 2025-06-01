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
    get formatGas () {
        return formatGas;
    },
    get shorten () {
        return shorten;
    }
});
function shorten(address) {
    return "".concat(address.slice(0, 6), "...").concat(address.slice(-4));
}
function formatGas(gasAmountWei) {
    // splits gas number with commas like so: 1,000,000
    return gasAmountWei.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
