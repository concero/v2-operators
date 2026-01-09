export interface IValidatorAdapter {
    pumpPendingRequest(size: number): Promise<void>;

    pumpFailedRequest(size: number): Promise<void>;

    pumpPendingConfirm(size: number): Promise<void>;

    pumpStuckVerificationRequests(size: number): Promise<void>;
}
