import { PrismaClient } from "@prisma/client";

class DbManager {
    private static instance: PrismaClient | null = null;

    private constructor() {}

    public static getClient(): PrismaClient {
        if (!DbManager.instance) {
            DbManager.instance = new PrismaClient();
        }
        return DbManager.instance;
    }

    public static async disconnect(): Promise<void> {
        if (DbManager.instance) {
            await DbManager.instance.$disconnect();
            DbManager.instance = null;
        }
    }
}

export { DbManager };
