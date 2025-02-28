import { decodeAbiParameters, parseAbiParameters } from "viem";
import type { GetTransactionReturnType } from "viem/actions/public/getTransaction";

//bun hardhat decode-clf-fulfill --txhash 0x3018db9bf3525621578311b8ee09b5f735bc68dfbfd2142154b671ece68691a1 --network base

// Authorized node operator addresses
// const authorizedSigners = [
//     getEnvVar("CLF_DON_SIGNING_KEY_0_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_1_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_2_BASE"),
//     getEnvVar("CLF_DON_SIGNING_KEY_3_BASE"),
// ];

const clfReportSubmissionAbi = parseAbiParameters([
    "bytes32[3] reportContext",
    "bytes report",
    "bytes32[] rs",
    "bytes32[] ss",
    "bytes32 rawVs",
]);

const clfReportAbi = parseAbiParameters([
    "bytes32[] requestIds",
    "bytes[] results",
    "bytes[] errors",
    "bytes[] onchainMetadata",
    "bytes[] offchainMetadata",
]);


/**
 * Decodes the Chainlink Functions report from a transaction hash.
 *
 * @param {GetTransactionReturnType} tx - The transaction to decode.
 * @returns {Promise<object>} - The formatted report data.
 */

export function decodeCLFReport(tx: GetTransactionReturnType) {
    // Remove '0x' prefix and the function selector (first 4 bytes)
    const inputData = tx.input.slice(10);

    // Decode the transaction input data
    const decodedData = decodeAbiParameters(clfReportSubmissionAbi, `0x${inputData}`);

    // Extract and decode the report
    const reportBytes = decodedData[1];
    const decodedReport = decodeAbiParameters(clfReportAbi, reportBytes);

    // Format the decoded data
    const report = {
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

    // console.log("Decoded Report:", JSON.stringify(report, null, 2));
    return report;
}

// function test() {
//     const bytesString =
//         "0x007199ce0f5742535344da9d38c6ab8cc283b44ec3a2d39b44c19e9af5bd76a9fb6a16ff8a1f82d58beb1095655a89e7f67656e1ec9c0fb1ea40fa2a1131c1c82c8f90b8876dee6538000000000101b43b";
//     const bytes = bytesString.startsWith("0x") ? bytesString.slice(2) : bytesString;
//     const buffer = Buffer.from(bytes, "hex");
//
//     console.log(`Bytes length: ${buffer.length}`); // Should be 81
//
//     let offset = 0;
//
//     // Read uint8 (1 byte)
//     const _uint8 = buffer.readUInt8(offset);
//     offset += 1;
//
//     // Read bytes32 (32 bytes)
//     const messageId = "0x" + buffer.slice(offset, offset + 32).toString("hex");
//     offset += 32;
//
//     // Read bytes32 (32 bytes)
//     const messageHash = "0x" + buffer.slice(offset, offset + 32).toString("hex");
//     offset += 32;
//
//     // Read uint64 (8 bytes)
//     const srcChainSelector = buffer.readBigUInt64BE(offset);
//     offset += 8;
//
//     // Read uint64 (8 bytes)
//     const srcBlockNumber = buffer.readBigUInt64BE(offset);
//     offset += 8;
//
//     console.log(`Decoded Result:`, {
//         _: _uint8,
//         messageId: messageId,
//         messageHash: messageHash,
//         srcChainSelector: srcChainSelector.toString(),
//         srcBlockNumber: srcBlockNumber.toString(),
//     });
// }
// test();
