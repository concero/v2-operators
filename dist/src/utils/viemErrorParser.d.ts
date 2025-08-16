import { BaseError, TransactionNotFoundError, WaitForTransactionReceiptTimeoutError } from 'viem';
export declare function isNonceError(error: BaseError): boolean;
export declare function isWaitingForReceiptError(error: BaseError): error is TransactionNotFoundError | WaitForTransactionReceiptTimeoutError;
//# sourceMappingURL=viemErrorParser.d.ts.map