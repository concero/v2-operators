function shorten(address) {
    return "".concat(address.slice(0, 6), "...").concat(address.slice(-4));
}
function formatGas(gasAmountWei) {
    // splits gas number with commas like so: 1,000,000
    return gasAmountWei.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export { formatGas, shorten };
