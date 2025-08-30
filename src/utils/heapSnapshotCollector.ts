import { writeHeapSnapshot } from 'v8';

import { Logger } from '@concero/operator-utils';

export function startHeapSnapshotCollection(
    logDir: string,
    intervalMs: number = 2 * 60 * 1000,
    logger?: ReturnType<typeof Logger.prototype.getLogger>,
): () => void {
    const log = logger || console;

    const intervalId = setInterval(() => {
        try {
            const filename = `${logDir}/heap-${Date.now()}.heapsnapshot`;
            writeHeapSnapshot(filename);
            log.info(`Wrote heap snapshot to ${filename}`);
        } catch (error) {
            log.error('Failed to write heap snapshot:', error);
        }
    }, intervalMs);

    // Return cleanup function to stop collection
    return () => {
        clearInterval(intervalId);
        log.info('Heap snapshot collection stopped');
    };
}
