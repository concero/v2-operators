import {
    BaseError,
    ContractFunctionExecutionError,
    NonceTooHighError,
    NonceTooLowError,
    TransactionExecutionError,
    TransactionNotFoundError,
    WaitForTransactionReceiptTimeoutError,
} from 'viem';

export function isNonceError(error: BaseError) {
    return (
        error instanceof ContractFunctionExecutionError &&
        error.cause instanceof TransactionExecutionError &&
        (error.cause.cause instanceof NonceTooHighError ||
            error.cause.cause instanceof NonceTooLowError)
    );
}

export function isWaitingForReceiptError(error: BaseError) {
    return (
        error instanceof TransactionNotFoundError ||
        error instanceof WaitForTransactionReceiptTimeoutError
    );
}
