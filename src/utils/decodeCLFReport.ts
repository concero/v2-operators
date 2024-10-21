import { decodeAbiParameters, parseAbiParameters } from "viem";
import type { GetTransactionReturnType } from "viem/actions/public/getTransaction";

//bun hardhat decode-clf-fulfill --txhash 0x3018db9bf3525621578311b8ee09b5f735bc68dfbfd2142154b671ece68691a1 --network base

const abiParameters = parseAbiParameters([
    "bytes32[3] reportContext",
    "bytes report",
    "bytes32[] rs",
    "bytes32[] ss",
    "bytes32 rawVs",
]);

const reportAbiParameters = parseAbiParameters([
    "bytes32[] requestIds",
    "bytes[] results",
    "bytes[] errors",
    "bytes[] onchainMetadata",
    "bytes[] offchainMetadata",
]);

// Authorized node operator addresses
// const authorizedSigners = [
//     getEnvVar("CLF_DON_SIGNING_KEY_0_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_1_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_2_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_3_BASE"),
// ];

/**
 * Decodes the Chainlink Functions report from a transaction hash.
 * @param {GetTransactionReturnType} tx - The transaction to decode.
 * @returns {Promise<object>} - The formatted report data.
 */
export function decodeCLFReport(tx: GetTransactionReturnType) {
    // Remove '0x' prefix and the function selector (first 4 bytes)
    const inputData = tx.input.slice(10);

    // Decode the transaction input data
    const decodedData = decodeAbiParameters(abiParameters, `0x${inputData}`);

    // Extract and decode the report
    const reportBytes = decodedData[1];
    const decodedReport = decodeAbiParameters(reportAbiParameters, reportBytes);

    // Format the decoded data
    const formattedData = {
        reportContext: decodedData[0],
        report: {
            requestIds: decodedReport[0],
            results: decodedReport[1],
            errors: decodedReport[2],
            onchainMetadata: decodedReport[3],
            offchainMetadata: decodedReport[4],
        },
        rs: decodedData[2],
        ss: decodedData[3],
        rawVs: decodedData[4],
        reportBytes: reportBytes,
    };

    console.log("Decoded Report:", JSON.stringify(formattedData, null, 2));
    const [decodedReportResponse] = decodeReportResult(decodedReport[1]);

    return decodedReportResponse;
}

/**
 * Decodes the report results and logs the data.
 * @param {string[]} results - The report results to decode.
 */

type CLFReportReturnType = {
    _: number;
    messageId: string;
    messageHash: string;
    srcChainSelector: number;
    srcBlockNumber: number;
};

function decodeReportResult(results): CLFReportReturnType[] {
    const response = [];
    results.forEach((result, i) => {
        const decodedResult = decodeAbiParameters(
            [
                { type: "uint8", name: "_" },
                { type: "bytes32", name: "messageId" },
                { type: "bytes32", name: "messageHash" },
                { type: "uint64", name: "srcChainSelector" },
                { type: "uint64", name: "srcBlockNumber" },
            ],
            result,
        );
        response.push(decodedResult);
        // console.log(`Decoded Result ${i}:`, decodedResult);
    });

    return response;
}
