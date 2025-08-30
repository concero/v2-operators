export function getRpcOverrides() {
    try {
        return require('../../rpc.overrides.json');
    } catch {
        return {};
    }
}

export function getRpcExtensions() {
    try {
        return require('../../rpc.extensions.json');
    } catch {
        return {};
    }
}
