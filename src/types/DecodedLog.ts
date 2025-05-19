import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";

import { Log } from "ethers";

export type DecodedLog = Log & DecodeEventLogReturnType;
