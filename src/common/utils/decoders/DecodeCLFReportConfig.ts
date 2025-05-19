import { reportConfigBitOffsets } from "../../../constants/reportConfig";
import { bitMasks } from "../../constants";

export type DecodedCLFReportConfig = {
    reportType: number;
    version: number;
    requester: string;
};

function decodeCLFReportConfig(configBytes: string): DecodedCLFReportConfig {
    const configUint = BigInt(`0x${configBytes.slice(2)}`);

    // Extract the fields according to the bit layout
    const reportType = Number(
        (configUint >> reportConfigBitOffsets.OFFSET_REPORT_TYPE) & bitMasks.MASK_8,
    );
    const version = Number((configUint >> reportConfigBitOffsets.OFFSET_VERSION) & bitMasks.MASK_8);

    // Extract requester (20 bytes/160 bits at the end)
    const requesterBits = configUint & ((1n << 160n) - 1n);
    const requester = "0x" + requesterBits.toString(16).padStart(40, "0");

    return {
        reportType,
        version,
        requester,
    };
}

export { decodeCLFReportConfig };
