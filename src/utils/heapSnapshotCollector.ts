import { writeHeapSnapshot } from 'v8';
import { Logger } from '@concero/operator-utils';

function createHeapSnapshot(logDir: string, log: ReturnType<typeof Logger.prototype.getLogger>) {
    try {
        const filename = `${logDir}/heap-${Date.now()}.heapsnapshot`;
        writeHeapSnapshot(filename);
        log.info(`Wrote heap snapshot to ${filename}`);
    } catch (error) {
        // @ts-ignore @todo: fix types
        log.error('Failed to write heap snapshot:', error);
    }
}

export function startHeapSnapshotCollection(
    logDir: string,
    intervalMs: number = 30 * 60 * 1000,
    logger?: ReturnType<typeof Logger.prototype.getLogger>,
): () => void {
    const log = logger || console;

    createHeapSnapshot(logDir, log);

    const intervalId = setInterval(() => {
        createHeapSnapshot(logDir, log);
    }, intervalMs);

    // Return cleanup function to stop collection.
    return () => {
        clearInterval(intervalId);
        log.info('Heap snapshot collection stopped');
    };
}
