import { PrismaClient } from '../../generated/prisma';

export class DbManager {
    private static dbClient: PrismaClient | null = null;

    private constructor() {}

    public static getClient() {
        if (!DbManager.dbClient) {
            DbManager.dbClient = new PrismaClient();
        }
        return DbManager.dbClient;
    }

    public static async disconnect() {
        if (DbManager.dbClient) {
            await DbManager.dbClient.$disconnect();
            DbManager.dbClient = null;
        }
    }
}
