import { PrismaClient } from '@prisma/client';

export class DbManager {
    private static dbClient: PrismaClient | null = null;

    public static getClient() {
        if (!DbManager.dbClient) {
            DbManager.dbClient = new PrismaClient();
        }

        return DbManager.dbClient;
    }
}
