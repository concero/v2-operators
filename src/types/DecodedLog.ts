import { Log } from "ethers";
import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";

export type DecodedLog = Log & DecodeEventLogReturnType;
