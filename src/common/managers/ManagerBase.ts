export abstract class ManagerBase {
    protected initialized: boolean = false;

    public async initialize(): Promise<void> {
        if (this.initialized) {
            return;
        }
        try {
            // Subclasses can implement additional initialization logic here
            this.initialized = true;
        } catch (error) {
            throw error;
        }
    }

    public dispose(): void {
        // Subclasses can override this method to dispose additional resources
        this.initialized = false;
    }
}
