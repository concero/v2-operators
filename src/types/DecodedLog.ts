import { Address } from "viem";
import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";
import { ConceroNetworkNames } from "./ConceroNetwork";

export type DecodedLog = {
    chainName: ConceroNetworkNames;
    contractAddress: Address;
    decodedLog: DecodeEventLogReturnType;
};
