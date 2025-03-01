import { parseAbiParameters, decodeAbiParameters } from "viem";
import { decodeCLFReportConfig } from "./DecodeCLFReportConfig";
import { decodeInternalMessageConfig } from "./decodeInternalMessageConfig";

export type DecodedMessageReportResult = {
    reportConfig: string;
    internalMessageConfig: string;
    messageId: string;
    messageHashSum: string;
    dstChainData: string;
    allowedOperators: string[];
    decodedConfig: ReturnType<typeof decodeCLFReportConfig>;
    decodedMessageConfig: ReturnType<typeof decodeInternalMessageConfig>;
};
function decodeMessageReportResult(resultBytes: string): DecodedMessageReportResult {
    try {
        // Define the ABI structure matching the Solidity struct
        const messageReportResultAbi = parseAbiParameters([
            'bytes32 reportConfig',
            'bytes32 internalMessageConfig',
            'bytes32 messageId',
            'bytes32 messageHashSum',
            'bytes dstChainData',
            'bytes[] allowedOperators'
        ]);

        // Use viem's decoder for proper ABI decoding
        const decodedData = decodeAbiParameters(messageReportResultAbi, resultBytes);

        // Extract values from the decoded data
        const [reportConfig, internalMessageConfig, messageId, messageHashSum, dstChainData, allowedOperators] = decodedData;

        return {
            reportConfig,
            internalMessageConfig,
            messageId,
            messageHashSum,
            dstChainData,
            allowedOperators,

            // Also return decoded configurations
            decodedConfig: decodeCLFReportConfig(reportConfig),
            decodedMessageConfig: decodeInternalMessageConfig(internalMessageConfig),
        };
    } catch (error) {
        console.error("Error decoding CLF message report response:", error);
        throw new Error("Failed to decode CLF message report response");
    }
}

export { decodeMessageReportResult };
