export namespace ObjectLib {
    export const stringify = (object: Record<string, unknown>) => {
        return JSON.stringify(object, (_, value) =>
            typeof value === 'bigint' ? value.toString() : value,
        );
    };
}
