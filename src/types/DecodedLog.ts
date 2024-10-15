import { ConceroNetworkNames } from "./ConceroNetwork";
import { Address } from "viem";
import { DecodeEventLogReturnType } from "viem/utils/abi/decodeEventLog";

export type DecodedLog = {
    chainName: ConceroNetworkNames;
    contractAddress: Address;
    decodedLog: DecodeEventLogReturnType;
};
