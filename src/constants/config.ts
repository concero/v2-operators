import { WaitForTransactionReceiptParameters, WriteContractParameters } from "viem";

export const viemReceiptConfig: WaitForTransactionReceiptParameters = {
    timeout: 0,
    confirmations: 2,
};
export const writeContractConfig: WriteContractParameters = {
    gas: 3000000n, // 3M
};
