export interface IValidatorAdapter {
    pumpPendingRequest(): Promise<void>;
    pumpFailedRequest(): Promise<void>;

    pumpPendingConfirm(): Promise<void>;
    pumpFailedConfirm(): Promise<void>;
}
