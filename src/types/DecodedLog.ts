import { Log } from "viem";
import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";

export type DecodedLog = Log & DecodeEventLogReturnType;
