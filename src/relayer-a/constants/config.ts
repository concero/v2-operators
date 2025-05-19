import { EventEmitter } from "node:events";

/**
 * Configuration for Relayer A.
 *
 * - BLOCK_HISTORY_SIZE: Number of recent block hashes to keep in memory for reorg detection and
 *   recovery. Increase for deeper reorg resilience, decrease for lower memory usage.
 */
export type RelayerAConfig = {
    POLLING_INTERVAL_MS?: number;
    BLOCK_HISTORY_SIZE?: number;
    eventEmitter: EventEmitter;
};

export const config: RelayerAConfig = {
    BLOCK_HISTORY_SIZE: 400,
    eventEmitter: new EventEmitter(),
};
