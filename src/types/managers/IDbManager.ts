import { PrismaClient } from "@prisma/client";

/**
 * Interface for database management operations.
 * Note: The current implementation uses static methods, but this interface
 * represents the contract for database operations.
 */
export interface IDbManager {
    getClient(): PrismaClient;
    disconnect(): Promise<void>;
}
