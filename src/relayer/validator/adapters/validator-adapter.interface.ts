export interface IValidatorAdapter {
    pumpPendingRequest(): Promise<void>;

    pumpFailedRequest(): Promise<void>;

    pumpPendingConfirm(): Promise<void>;

    pumpStuckVerificationRequests(): Promise<void>;
}
