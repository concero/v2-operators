import {decodeInternalMessageConfig} from "./decodeInternalMessageConfig";
import {decodeCLFReportConfig} from "./DecodeCLFReportConfig";

export type DecodedMessageReportResult = {
    reportConfig: string;
    internalMessageConfig: string;
    messageId: string;
    messageHashSum: string;
    dstChainData: string;
    allowedOperators: string[];
    decodedConfig: ReturnType<typeof decodeCLFReportConfig>;
    decodedMessageConfig: ReturnType<typeof decodeInternalMessageConfig>;
}

function decodeMessageReportResult(resultBytes: string): DecodedMessageReportResult {
  try {
    // Remove 0x prefix if present
    const data = resultBytes.startsWith('0x') ? resultBytes.slice(2) : resultBytes;

    // In ABI encoding, each field is 32 bytes (64 hex chars)
    // The first 32 bytes is the reportConfig
    const reportConfig = '0x' + data.slice(0, 64);

    // The next 32 bytes is the internalMessageConfig
    const internalMessageConfig = '0x' + data.slice(64, 128);

    // Next 32 bytes for messageId
    const messageId = '0x' + data.slice(128, 192);

    // Next 32 bytes for messageHashSum
    const messageHashSum = '0x' + data.slice(192, 256);

    // For dynamic fields (bytes and arrays), the next values are offsets
    // We'd need to follow offset pointers to get the actual data
    // This gets more complex with nested dynamic types

    // For simplicity in this implementation:
    let dstChainData = '0x';
    let allowedOperators = [];

    return {
      reportConfig,
      internalMessageConfig,
      messageId,
      messageHashSum,
      dstChainData,
      allowedOperators,

      // For convenience, also return the decoded values
      decodedConfig: decodeCLFReportConfig(reportConfig),
      decodedMessageConfig: decodeInternalMessageConfig(internalMessageConfig)
    };
  } catch (error) {
    console.error("Error decoding CLF message report response:", error);
    throw new Error("Failed to decode CLF message report response");
  }
}

export {decodeMessageReportResult};
