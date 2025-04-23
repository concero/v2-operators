import { EventEmitter } from "node:events";

export type RelayerAConfig = {
    POLLING_INTERVAL_MS: number;
    eventEmitter: EventEmitter;
};

export const config: RelayerAConfig = {
    eventEmitter: new EventEmitter(),
};
