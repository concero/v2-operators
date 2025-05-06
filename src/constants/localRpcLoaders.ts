export function getRpcOverride() {
    try {
        return require("../../rpcs.override.json");
    } catch {
        return {};
    }
}

export function getRpcExtension() {
    try {
        return require("../../rpcs.extension.json");
    } catch {
        return {};
    }
}
