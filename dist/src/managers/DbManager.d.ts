import { PrismaClient } from '@prisma/client';
declare class DbManager {
    private static instance;
    private constructor();
    static getClient(): PrismaClient;
    static disconnect(): Promise<void>;
}
export { DbManager };
//# sourceMappingURL=DbManager.d.ts.map