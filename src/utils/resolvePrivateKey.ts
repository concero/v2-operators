export function resolvePrivateKey(raw: string | undefined): `0x${string}` {
    if (!raw) throw new Error('OPERATOR_PRIVATE_KEY is not set');

    let t = raw
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .replace(/\s+/g, '');

    if (/^[0-9a-fA-F]{64}$/.test(t)) t = '0x' + t;

    if (!/^0x[0-9a-fA-F]{64}$/.test(t)) {
        const sample = t.slice(0, 10);
        throw new Error(
            `OPERATOR_PRIVATE_KEY has invalid format. Got: "${sample}..." (len=${t.length}). Expected 0x + 64 hex.`,
        );
    }
    return t as `0x${string}`;
}
