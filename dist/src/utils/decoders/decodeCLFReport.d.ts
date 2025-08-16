import type { GetTransactionReturnType } from 'viem/actions/public/getTransaction';
/**
 * Decodes the Chainlink Functions report from a transaction hash.
 *
 * @param {GetTransactionReturnType} tx - The transaction to decode.
 * @returns {Promise<object>} - The formatted report data.
 */
export declare function decodeCLFReport(tx: GetTransactionReturnType): {
    reportContext: readonly [`0x${string}`, `0x${string}`, `0x${string}`];
    report: {
        requestIds: readonly `0x${string}`[];
        results: readonly `0x${string}`[];
        errors: readonly `0x${string}`[];
        onchainMetadata: readonly `0x${string}`[];
        offchainMetadata: readonly `0x${string}`[];
    };
    rs: readonly `0x${string}`[];
    ss: readonly `0x${string}`[];
    rawVs: `0x${string}`;
    reportBytes: `0x${string}`;
};
//# sourceMappingURL=decodeCLFReport.d.ts.map