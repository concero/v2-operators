export interface IValidatorAdapter {
    pumpPendingVerification(size: number): Promise<void>;

    pumpFailedVerification(size: number): Promise<void>;

    pumpStuckVerificationRequests(size: number): Promise<void>;
}
