export abstract class Singleton {
    protected constructor() {}

    public static getInstance<T>(
        this: (new (...args: any[]) => T) & { instance?: any },
        ...args: any[]
    ): T {
        if (!this.instance) {
            this.instance = new this(...args);
        }
        return this.instance;
    }
}
