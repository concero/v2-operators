export function getRpcOverride() {
    try {
        return require("../../rpcs.override.json");
    } catch (e) {
        return {};
    }
}
export function getRpcExtension() {
    try {
        return require("../../rpcs.extension.json");
    } catch (e) {
        return {};
    }
}
